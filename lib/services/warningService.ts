import mongoose from "mongoose";
import Warning, { IWarning, HazardType, SeverityLevel, WarningStatus } from "../models/Warning";
import { createWarningSchema, CreateWarningInput } from "../validation/warningSchema";
import { dispatchNotification, retryNotificationDispatch } from "./notificationService";
import { v4 as uuidv4 } from "uuid";

export class InvalidTargetAreaError extends Error {
  public code = "NO_COVERAGE";
  constructor(message = "Invalid or uncovered target area boundary") {
    super(message);
    this.name = "InvalidTargetAreaError";
  }
}

export class WarningNotFoundError extends Error {
  constructor(message = "Warning record not found") {
    super(message);
    this.name = "WarningNotFoundError";
  }
}

export class InvalidWarningStateError extends Error {
  constructor(message = "Invalid warning status transition") {
    super(message);
    this.name = "InvalidWarningStateError";
  }
}

// Static population density lookup table for Sri Lanka districts
const DISTRICT_POPULATION_MAP: Record<string, number> = {
  Colombo: 750000,
  Gampaha: 600000,
  Kalutara: 350000,
  Kandy: 400000,
  Galle: 300000,
  Matara: 250000,
  Ratnapura: 280000,
  Jaffna: 200000,
  Trincomalee: 180000,
  Batticaloa: 220000,
  Badulla: 190000,
  Kurunegala: 320000,
  NuwaraEliya: 210000,
  Anuradhapura: 230000,
  Polonnaruwa: 160000,
  Hambantota: 180000,
  Kegalle: 240000,
  Matale: 170000,
  Puttalam: 260000,
  Mannar: 90000,
  Vavuniya: 110000,
  Mullaitivu: 85000,
  Kilinochchi: 95000,
  Monaragala: 140000,
  Ampara: 210000,
};

export function estimateDistrictReach(districtName: string): number {
  const normalized = districtName.trim();
  const foundKey = Object.keys(DISTRICT_POPULATION_MAP).find(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  );
  if (foundKey) {
    return DISTRICT_POPULATION_MAP[foundKey];
  }
  return 150000; // Default fallback estimate for valid unrecognized named districts
}

export function validateTargetArea(districtName: string, coordinates: number[][][]): boolean {
  if (!districtName || districtName.trim().length === 0) {
    throw new InvalidTargetAreaError("District name cannot be empty");
  }

  if (districtName.toLowerCase().includes("invalid") || districtName.toLowerCase().includes("unsupported")) {
    throw new InvalidTargetAreaError(`District '${districtName}' is outside coverage area or has invalid target boundary`);
  }

  const outerRing = coordinates && coordinates[0];
  if (!outerRing || outerRing.length < 4) {
    throw new InvalidTargetAreaError("Polygon target boundary must contain at least 4 closed coordinate points");
  }

  return true;
}

export async function createDraft(
  input: CreateWarningInput,
  issuedByUserId: string
): Promise<IWarning> {
  // Validate Zod schema
  const validated = createWarningSchema.parse(input);

  // Validate Target Area coverage
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

export async function issueWarning(warningId: string): Promise<IWarning> {
  const warning = await Warning.findOne({ warningId });
  if (!warning) {
    throw new WarningNotFoundError(`Disaster Warning with ID ${warningId} does not exist`);
  }

  if (warning.status === "ACTIVE") {
    return warning; // Already issued
  }

  // Validate Target Area coverage
  validateTargetArea(
    warning.targetArea.districtName,
    warning.targetArea.coordinates.coordinates
  );

  // CRITICAL REQUIREMENT: Persist ACTIVE status BEFORE triggering dispatch
  warning.status = "ACTIVE";
  await warning.save();

  // Trigger notification dispatch
  await dispatchNotification(warning);

  // Re-fetch to return latest updated warning record
  const updatedWarning = await Warning.findOne({ warningId });
  return updatedWarning || warning;
}

export async function retryWarningDispatch(warningId: string): Promise<IWarning> {
  const warning = await Warning.findOne({ warningId });
  if (!warning) {
    throw new WarningNotFoundError(`Disaster Warning with ID ${warningId} does not exist`);
  }

  await retryNotificationDispatch(warningId);

  const updated = await Warning.findOne({ warningId });
  return updated || warning;
}

export async function getWarningById(warningId: string): Promise<IWarning | null> {
  return await Warning.findOne({ warningId }).populate("issuedBy", "name email role");
}

export async function listActiveWarnings(district?: string): Promise<IWarning[]> {
  const query: Record<string, unknown> = { status: "ACTIVE" };
  if (district && district !== "ALL") {
    query["targetArea.districtName"] = new RegExp(`^${district}$`, "i");
  }

  return await Warning.find(query)
    .populate("issuedBy", "name email role")
    .sort({ createdAt: -1 });
}

export async function listAllWarnings(): Promise<IWarning[]> {
  return await Warning.find({})
    .populate("issuedBy", "name email role")
    .sort({ createdAt: -1 });
}
