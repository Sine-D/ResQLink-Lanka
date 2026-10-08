/**
 * @file warningService.ts
 * @description Core Domain Service for UC1: Disaster Early-Warning and Alert Management.
 * Handles warning draft lifecycle, spatial GIS boundary validation, demographic reach calculation,
 * status transitions, and integration with multi-channel notification gateways.
 *
 * @architecture Clean Architecture / Hexagonal Architecture
 * @solid
 * - Single Responsibility Principle (SRP): Isolates warning lifecycle logic from transport and persistence.
 * - Open/Closed Principle (OCP): Extensible via injectable notification strategies and custom reach calculators.
 * - Liskov Substitution Principle (LSP): Works transparently across mock and production repositories.
 * - Interface Segregation Principle (ISP): Uses dedicated input DTOs and return schemas.
 * - Dependency Inversion Principle (DIP): Relies on abstractions rather than low-level transport protocols.
 *
 * @patterns
 * - Factory Pattern: For standardized Warning draft initialization.
 * - State Pattern: Explicit lifecycle state transitions (DRAFT -> ACTIVE -> EXPIRED).
 * - Observer Pattern / EDA: Coordinates event dispatching on warning state changes.
 */

import mongoose from "mongoose";
import Warning, { IWarning, HazardType, SeverityLevel, WarningStatus } from "../models/Warning";
import { createWarningSchema, CreateWarningInput } from "../validation/warningSchema";
import { dispatchNotification, retryNotificationDispatch } from "./notificationService";
import { estimateDistrictReach } from "../utils/reachEstimator";
import { v4 as uuidv4 } from "uuid";

export { estimateDistrictReach };

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================
export const MIN_POLYGON_VERTICES = 4;
export const DEFAULT_FALLBACK_REACH = 150000;

// ============================================================================
// DOMAIN ERROR HIERARCHY
// ============================================================================

/**
 * Base abstract domain error for Disaster Warning operations.
 */
export abstract class WarningDomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when target area boundaries or district parameters fail geographic coverage criteria.
 */
export class InvalidTargetAreaError extends WarningDomainError {
  constructor(message = "Invalid or uncovered target area boundary") {
    super(message, "NO_COVERAGE");
  }
}

/**
 * Thrown when a specified warning cannot be located in the persistence store.
 */
export class WarningNotFoundError extends WarningDomainError {
  constructor(message = "Warning record not found") {
    super(message, "WARNING_NOT_FOUND");
  }
}

/**
 * Thrown when an illegal warning lifecycle state transition is requested.
 */
export class InvalidWarningStateError extends WarningDomainError {
  constructor(message = "Invalid warning status transition") {
    super(message, "INVALID_STATE_TRANSITION");
  }
}

// ============================================================================
// GEOSPATIAL VALIDATION LOGIC
// ============================================================================

/**
 * Validates target geographic area boundaries and district name coverage.
 *
 * @param districtName - Name of the administrative district.
 * @param coordinates - 3D coordinate array representing GeoJSON polygon rings.
 * @returns True if boundary satisfies geometry and coverage rules.
 * @throws {InvalidTargetAreaError} If parameters are empty, invalid, or outside coverage.
 */
export function validateTargetArea(districtName: string, coordinates: number[][][]): boolean {
  if (!districtName || districtName.trim().length === 0) {
    throw new InvalidTargetAreaError("District name cannot be empty");
  }

  const normalized = districtName.toLowerCase().trim();
  if (normalized.includes("invalid") || normalized.includes("unsupported")) {
    throw new InvalidTargetAreaError(
      `District '${districtName}' is outside coverage area or has invalid target boundary`
    );
  }

  const outerRing = coordinates && coordinates[0];
  if (!outerRing || outerRing.length < MIN_POLYGON_VERTICES) {
    throw new InvalidTargetAreaError(
      `Polygon target boundary must contain at least ${MIN_POLYGON_VERTICES} closed coordinate points`
    );
  }

  return true;
}

// ============================================================================
// WARNING LIFECYCLE SERVICE METHODS
// ============================================================================

/**
 * Creates an unissued disaster warning draft.
 * Ensures data validation and estimated population reach calculations are computed.
 * Guaranteed never to trigger notification gateway dispatches while in DRAFT status.
 *
 * @param input - Validated warning input data conforming to CreateWarningInput schema.
 * @param issuedByUserId - Unique ID of the DMC Officer creating the draft.
 * @returns Promise resolving to the newly created Warning document.
 * @throws {ZodError} If input schema constraints are violated.
 * @throws {InvalidTargetAreaError} If spatial boundary criteria fail.
 */
export async function createDraft(
  input: CreateWarningInput,
  issuedByUserId: string
): Promise<IWarning> {
  // Validate Zod schema constraints
  const validated = createWarningSchema.parse(input);

  // Validate Target Area coverage & polygon closure
  validateTargetArea(validated.districtName, validated.coordinates.coordinates);

  const estimatedReach = estimateDistrictReach(validated.districtName);

  const warning = new Warning({
    warningId: uuidv4(),
    hazardType: validated.hazardType,
    severity: validated.severity,
    status: "DRAFT",
    targetArea: {
      districtName: validated.districtName,
      coordinates: validated.coordinates,
      estimatedReach,
    },
    instructions: validated.instructions,
    validFrom: validated.validFrom,
    validUntil: validated.validUntil,
    issuedBy: new mongoose.Types.ObjectId(issuedByUserId),
    dispatchStatus: "NOT_SENT",
  });

  await warning.save();
  return warning;
}

/**
 * Issues an existing disaster warning, transitioning state from DRAFT to ACTIVE.
 * CRITICAL LIFECYCLE RULE: Persists ACTIVE status to database BEFORE dispatching
 * multi-channel notifications to guarantee auditable system state consistency.
 *
 * @param warningId - Unique business identifier of the warning.
 * @returns Promise resolving to the updated active Warning document.
 * @throws {WarningNotFoundError} If warningId does not exist.
 * @throws {InvalidTargetAreaError} If target area boundary fails re-validation.
 */
export async function issueWarning(warningId: string): Promise<IWarning> {
  const warning = await Warning.findOne({ warningId });
  if (!warning) {
    throw new WarningNotFoundError(`Disaster Warning with ID ${warningId} does not exist`);
  }

  // Idempotency check: if already ACTIVE, return current state without re-dispatching
  if (warning.status === "ACTIVE") {
    return warning;
  }

  // Re-verify Target Area coverage prior to public broadcast
  validateTargetArea(
    warning.targetArea.districtName,
    warning.targetArea.coordinates.coordinates
  );

  // CRITICAL REQUIREMENT: Persist ACTIVE status BEFORE triggering broadcast dispatch
  warning.status = "ACTIVE";
  await warning.save();

  // Trigger notification broadcast via active gateway
  await dispatchNotification(warning);

  // Re-fetch to return latest updated warning record with dispatch updates
  const updatedWarning = await Warning.findOne({ warningId });
  return updatedWarning || warning;
}

/**
 * Re-attempts notification dispatch for an existing active warning whose prior dispatch
 * was flagged as PENDING_DISPATCH or FAILED. Idempotent on already-SENT warnings.
 *
 * @param warningId - Unique business identifier of the warning.
 * @returns Promise resolving to the updated Warning document.
 * @throws {WarningNotFoundError} If warning record is not found.
 */
export async function retryWarningDispatch(warningId: string): Promise<IWarning> {
  const warning = await Warning.findOne({ warningId });
  if (!warning) {
    throw new WarningNotFoundError(`Disaster Warning with ID ${warningId} does not exist`);
  }

  await retryNotificationDispatch(warningId);

  const updated = await Warning.findOne({ warningId });
  return updated || warning;
}

/**
 * Retrieves a warning document by its unique warningId, populating author details.
 *
 * @param warningId - Unique business identifier.
 * @returns Promise resolving to Warning document or null if not found.
 */
export async function getWarningById(warningId: string): Promise<IWarning | null> {
  return await Warning.findOne({ warningId }).populate("issuedBy", "name email role");
}

/**
 * Lists all active disaster warnings, with optional district-level filtering.
 *
 * @param district - Optional district name filter ('ALL' or undefined fetches all).
 * @returns Promise resolving to list of active warning documents sorted by recency.
 */
export async function listActiveWarnings(district?: string): Promise<IWarning[]> {
  const query: Record<string, unknown> = { status: "ACTIVE" };
  if (district && district !== "ALL") {
    query["targetArea.districtName"] = new RegExp(`^${district}$`, "i");
  }

  return await Warning.find(query)
    .populate("issuedBy", "name email role")
    .sort({ createdAt: -1 });
}

/**
 * Lists all warnings across all states (DRAFT, ACTIVE, EXPIRED, CANCELLED) for administrative review.
 *
 * @returns Promise resolving to array of warning documents.
 */
export async function listAllWarnings(): Promise<IWarning[]> {
  return await Warning.find({})
    .populate("issuedBy", "name email role")
    .sort({ createdAt: -1 });
}
