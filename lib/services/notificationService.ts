import mongoose from "mongoose";
import NotificationModel, { INotification, NotificationChannel, NotificationStatus } from "../models/Notification";
import Warning, { IWarning } from "../models/Warning";
import { v4 as uuidv4 } from "uuid";

export class GatewayUnavailableError extends Error {
  constructor(message = "Notification Gateway currently unavailable") {
    super(message);
    this.name = "GatewayUnavailableError";
  }
}

export class GatewayCriticalError extends Error {
  constructor(message = "Critical transmission failure") {
    super(message);
    this.name = "GatewayCriticalError";
  }
}

export interface IGatewayClient {
  send(payload: {
    district: string;
    channel: NotificationChannel;
    message: string;
    targetReach: number;
  }): Promise<{ success: boolean; messageId: string }>;
}

// Default mock gateway client implementation
export class MockEmergencyGatewayClient implements IGatewayClient {
  private mode: "SUCCESS" | "UNAVAILABLE" | "CRITICAL_ERROR" = "SUCCESS";

  setMode(mode: "SUCCESS" | "UNAVAILABLE" | "CRITICAL_ERROR") {
    this.mode = mode;
  }

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

let activeGatewayClient: IGatewayClient = new MockEmergencyGatewayClient();

export function setGatewayClient(client: IGatewayClient) {
  activeGatewayClient = client;
}

export function getGatewayClient(): IGatewayClient {
  return activeGatewayClient;
}

export async function dispatchNotification(
  warning: IWarning,
  channel: NotificationChannel = "BOTH"
): Promise<INotification> {
  const notificationId = uuidv4();
  const message = `[EMERGENCY WARNING - ${warning.severity.toUpperCase()}] ${warning.hazardType} hazard reported in ${warning.targetArea.districtName}. Instructions: ${warning.instructions}`;

  // Find existing notification or create pending
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
    // Attempt dispatch via injectable gateway client
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
      // Critical error or other failure
      notification.status = "FAILED";
      notification.errorLog = `[CRITICAL_FAILURE] ${errorMessage}`;
      await notification.save();

      await Warning.findByIdAndUpdate(warning._id, { dispatchStatus: "FAILED" });
      return notification;
    }
  }

  return notification;
}

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
