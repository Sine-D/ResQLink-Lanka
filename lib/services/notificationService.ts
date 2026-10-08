/**
 * @file notificationService.ts
 * @description Notification Dispatch and Gateway Service for UC1: Disaster Early-Warning.
 * Manages the dispatch of emergency broadcast alerts via multi-channel notification gateways
 * (SMS, Web Push, In-App) with built-in retry mechanisms, fault-tolerance, and idempotency.
 *
 * @architecture Clean Architecture / Hexagonal Architecture
 * @solid
 * - Single Responsibility Principle (SRP): Focuses exclusively on formatting, delivering,
 *   and tracking alert notifications across communication channels.
 * - Open/Closed Principle (OCP): Pluggable gateway architecture allows integrating real telco
 *   gateways (Dialog/Mobitel SMS, Firebase Cloud Messaging) without modifying dispatch logic.
 * - Liskov Substitution Principle (LSP): Any client implementing IGatewayClient can substitute
 *   MockEmergencyGatewayClient seamlessly.
 * - Interface Segregation Principle (ISP): IGatewayClient provides a concise, focused interface.
 * - Dependency Inversion Principle (DIP): High-level dispatch flow depends upon the IGatewayClient
 *   abstraction rather than concrete networking hardware.
 *
 * @patterns
 * - Strategy Pattern: Selectable communication channels (SMS, PUSH, BOTH).
 * - Adapter Pattern: Adapts domain Warning entities into provider-specific alert payloads.
 */

import mongoose from "mongoose";
import NotificationModel, {
  INotification,
  NotificationChannel,
  NotificationStatus,
} from "../models/Notification";
import Warning, { IWarning } from "../models/Warning";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// GATEWAY ERROR DEFINITIONS
// ============================================================================

/**
 * Thrown when the notification gateway encounters temporary network or availability errors.
 * Results in a PENDING_DISPATCH state so the system can retry later.
 */
export class GatewayUnavailableError extends Error {
  constructor(message = "Notification Gateway currently unavailable") {
    super(message);
    this.name = "GatewayUnavailableError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the notification gateway encounters an unrecoverable payload or transmission error.
 * Results in a FAILED state requiring manual administrative intervention.
 */
export class GatewayCriticalError extends Error {
  constructor(message = "Critical transmission failure") {
    super(message);
    this.name = "GatewayCriticalError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ============================================================================
// GATEWAY CLIENT INTERFACE & MOCK IMPLEMENTATION (STRATEGY PATTERN)
// ============================================================================

/**
 * Abstraction representing any external communication gateway (SMS, Push, IVR, Siren).
 */
export interface IGatewayClient {
  send(payload: {
    district: string;
    channel: NotificationChannel;
    message: string;
    targetReach: number;
  }): Promise<{ success: boolean; messageId: string }>;
}

/**
 * Simulated gateway client designed for offline-resilient execution and automated unit testing.
 * Supports configurable failure simulation modes (SUCCESS, UNAVAILABLE, CRITICAL_ERROR).
 */
export class MockEmergencyGatewayClient implements IGatewayClient {
  private mode: "SUCCESS" | "UNAVAILABLE" | "CRITICAL_ERROR" = "SUCCESS";

  /**
   * Sets the operational mode for testing fault tolerance and retry logic.
   */
  setMode(mode: "SUCCESS" | "UNAVAILABLE" | "CRITICAL_ERROR"): void {
    this.mode = mode;
  }

  /**
   * Dispatches emergency alert payload to simulated network endpoints.
   */
  async send(payload: {
    district: string;
    channel: NotificationChannel;
    message: string;
    targetReach: number;
  }): Promise<{ success: boolean; messageId: string }> {
    if (this.mode === "UNAVAILABLE") {
      throw new GatewayUnavailableError("Simulated SMS/PUSH Gateway network timeout");
    }
    if (this.mode === "CRITICAL_ERROR") {
      throw new GatewayCriticalError("Simulated critical gateway rejected broadcast payload");
    }

    return {
      success: true,
      messageId: `GW-MSG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };
  }
}

// Active singleton gateway client reference (Dependency Injection target)
let activeGatewayClient: IGatewayClient = new MockEmergencyGatewayClient();

/**
 * Injects a custom gateway client (used during unit testing or environment bootstrap).
 */
export function setGatewayClient(client: IGatewayClient): void {
  activeGatewayClient = client;
}

/**
 * Retrieves the currently active gateway client instance.
 */
export function getGatewayClient(): IGatewayClient {
  return activeGatewayClient;
}

// ============================================================================
// CORE NOTIFICATION DISPATCH METHODS
// ============================================================================

/**
 * Dispatches emergency alert notifications to citizens within the warning's affected target area.
 * Idempotently creates or updates the Notification record and manages error logs upon failure.
 *
 * @param warning - Active Warning document to broadcast.
 * @param channel - Desired delivery channel ('SMS' | 'PUSH' | 'BOTH'). Defaults to 'BOTH'.
 * @returns Promise resolving to the updated Notification document.
 */
export async function dispatchNotification(
  warning: IWarning,
  channel: NotificationChannel = "BOTH"
): Promise<INotification> {
  const notificationId = uuidv4();
  const message = `[EMERGENCY WARNING - ${warning.severity.toUpperCase()}] ${warning.hazardType} hazard reported in ${warning.targetArea.districtName}. Instructions: ${warning.instructions}`;

  // Find existing notification or create pending record
  let notification = await NotificationModel.findOne({ warningId: warning._id });
  if (!notification) {
    notification = new NotificationModel({
      notificationId,
      warningId: warning._id,
      channel,
      message,
      status: "PENDING_DISPATCH",
      retryCount: 0,
      errorLog: null,
      sentAt: null,
    });
  }

  try {
    // Attempt dispatch via injectable gateway client abstraction
    const result = await activeGatewayClient.send({
      district: warning.targetArea.districtName,
      channel,
      message,
      targetReach: warning.targetArea.estimatedReach,
    });

    if (result.success) {
      notification.status = "SENT";
      notification.sentAt = new Date();
      notification.errorLog = null;
      await notification.save();

      await Warning.findByIdAndUpdate(warning._id, { dispatchStatus: "SENT" });
      return notification;
    }
  } catch (err: unknown) {
    notification.retryCount += 1;
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (err instanceof GatewayUnavailableError) {
      notification.status = "PENDING_DISPATCH";
      notification.errorLog = `[UNAVAILABLE] ${errorMessage}`;
      await notification.save();

      await Warning.findByIdAndUpdate(warning._id, { dispatchStatus: "PENDING_DISPATCH" });
      return notification;
    } else {
      // Critical error or unexpected non-gateway exception
      notification.status = "FAILED";
      notification.errorLog = `[CRITICAL_FAILURE] ${errorMessage}`;
      await notification.save();

      await Warning.findByIdAndUpdate(warning._id, { dispatchStatus: "FAILED" });
      return notification;
    }
  }

  return notification;
}

/**
 * Re-attempts notification dispatch for an existing warning.
 * Guarantees idempotency: If notification is already marked as SENT, it safely returns
 * the existing record without duplicating dispatches or messages to citizens.
 *
 * @param warningId - Unique business identifier of the warning.
 * @returns Promise resolving to the updated Notification document or null.
 * @throws {Error} If warning with the given warningId is not found.
 */
export async function retryNotificationDispatch(warningId: string): Promise<INotification | null> {
  const warning = await Warning.findOne({ warningId });
  if (!warning) {
    throw new Error(`Warning with ID ${warningId} not found`);
  }

  // Idempotency check: if dispatch is already SENT, return current notification without re-sending
  if (warning.dispatchStatus === "SENT") {
    const existingNotification = await NotificationModel.findOne({ warningId: warning._id });
    return existingNotification;
  }

  return await dispatchNotification(warning);
}
