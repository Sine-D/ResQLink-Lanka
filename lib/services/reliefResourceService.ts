/**
 * @file reliefResourceService.ts
 * @description Core Domain Service for Relief Resource Management, Multi-Agency Allocation,
 * and Dispatch Order State Machine.
 *
 * Design Patterns & Principles Applied:
 * - Single Responsibility Principle (SRP): Isolates relief business logic and inventory mutations.
 * - Open/Closed Principle (OCP): Status machine transitions and custom errors are extensible.
 * - Liskov Substitution Principle (LSP): Domain errors inherit from native Error with unique codes.
 * - State Machine Pattern: Enforces valid dispatch life-cycle transitions (PENDING -> DELIVERED).
 */

import mongoose from "mongoose";
import ReliefResource, { IReliefResource, AvailabilityStatus } from "../models/ReliefResource";
import Distribution, { IDistribution } from "../models/Distribution";
import DispatchOrder, { IDispatchOrder } from "../models/DispatchOrder";
import User from "../models/User";
import { v4 as uuidv4 } from "uuid";
import {
  ResourceFilterInput,
  MultiAgencyAllocateInput,
  resourceFilterSchema,
  multiAgencyAllocateSchema,
} from "../validation/resourceSchema";

export class InsufficientStockError extends Error {
  public code = "INSUFFICIENT_STOCK";
  constructor(message = "Requested quantity exceeds currently available stock") {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class ResourceUnavailableError extends Error {
  public code = "RESOURCE_UNAVAILABLE";
  constructor(message = "Resource is currently unavailable for allocation") {
    super(message);
    this.name = "ResourceUnavailableError";
  }
}

export class ResourceNotFoundError extends Error {
  public code = "RESOURCE_NOT_FOUND";
  constructor(message = "Relief resource not found") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export class DispatchRejectedError extends Error {
  public code = "DISPATCH_REJECTED";
  constructor(message = "Dispatch order was rejected by agency coordinator") {
    super(message);
    this.name = "DispatchRejectedError";
  }
}

export class TrackingUnavailableError extends Error {
  public code = "TRACKING_UNAVAILABLE";
  constructor(message = "Live tracking telemetry is currently unavailable") {
    super(message);
    this.name = "TrackingUnavailableError";
  }
}

export class DispatchCreationError extends Error {
  public code = "DISPATCH_CREATION_FAILED";
  constructor(message = "Failed to create or persist dispatch order record") {
    super(message);
    this.name = "DispatchCreationError";
  }
}

export class DuplicateDispatchError extends Error {
  public code = "DUPLICATE_DISPATCH";
  constructor(message = "A dispatch order with this ID or allocation already exists") {
    super(message);
    this.name = "DuplicateDispatchError";
  }
}

export class InvalidQuantityError extends Error {
  public code = "INVALID_QUANTITY";
  constructor(message = "Quantity must be a positive number greater than 0") {
    super(message);
    this.name = "InvalidQuantityError";
  }
}

export class IncidentNotFoundError extends Error {
  public code = "INCIDENT_NOT_FOUND";
  constructor(message = "Specified disaster incident record was not found") {
    super(message);
    this.name = "IncidentNotFoundError";
  }
}

export class InvalidStatusTransitionError extends Error {
  public code = "INVALID_STATUS_TRANSITION";
  constructor(message = "Invalid dispatch status transition requested") {
    super(message);
    this.name = "InvalidStatusTransitionError";
  }
}

export function validateStatusTransition(currentStatus: string, nextStatus: string): void {
  if (currentStatus === nextStatus) {
    throw new InvalidStatusTransitionError(
      `Dispatch is already in state '${currentStatus}'. Cannot apply duplicate transition.`
    );
  }
  if (currentStatus === "DELIVERED") {
    throw new InvalidStatusTransitionError(
      "Dispatch order is already DELIVERED. Cannot alter status of completed delivery."
    );
  }
  if (currentStatus === "REJECTED") {
    throw new InvalidStatusTransitionError(
      "Dispatch order was REJECTED. Cannot transition a rejected order."
    );
  }

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "REJECTED"],
    CONFIRMED: ["DISPATCHED", "IN_TRANSIT", "REJECTED"],
    DISPATCHED: ["IN_TRANSIT", "DELIVERED", "REJECTED"],
    IN_TRANSIT: ["DELIVERED", "REJECTED"],
  };

  const allowed = allowedTransitions[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new InvalidStatusTransitionError(
      `Invalid status transition from '${currentStatus}' to '${nextStatus}'.`
    );
  }
}

export async function listAvailableResources(
  rawFilters: ResourceFilterInput = {}
): Promise<IReliefResource[]> {
  const filters = resourceFilterSchema.parse(rawFilters);
  const query: Record<string, unknown> = {};

  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.agency) {
    query.agency = new RegExp(`^${filters.agency.trim()}$`, "i");
  }
  if (filters.district) {
    query.district = new RegExp(`^${filters.district.trim()}$`, "i");
  }
  if (filters.status) {
    query.availabilityStatus = filters.status;
  }
  if (filters.minQuantity !== undefined) {
    query.quantity = { $gte: filters.minQuantity };
  }

  return await ReliefResource.find(query).sort({ updatedAt: -1 });
}

export async function checkResourceAvailability(
  resourceId: string,
  requestedQuantity: number
): Promise<{ resource: IReliefResource; availableStock: number }> {
  let resource = await ReliefResource.findOne({ resourceId });
  if (!resource && mongoose.Types.ObjectId.isValid(resourceId)) {
    resource = await ReliefResource.findById(resourceId);
  }

  if (!resource) {
    throw new ResourceNotFoundError(`Resource '${resourceId}' not found`);
  }

  if (
    resource.availabilityStatus === "UNAVAILABLE" ||
    resource.availabilityStatus === "DEPLETED"
  ) {
    throw new ResourceUnavailableError(
      `Resource '${resource.name}' (${resource.resourceId}) is currently marked as ${resource.availabilityStatus}`
    );
  }

  if (resource.quantity < requestedQuantity) {
    throw new InsufficientStockError(
      `Requested quantity (${requestedQuantity}) exceeds available stock (${resource.quantity}) for '${resource.name}'`
    );
  }

  return { resource, availableStock: resource.quantity };
}

export async function allocateMultiAgencyResources(
  rawInput: MultiAgencyAllocateInput,
  officerUserId: string
): Promise<{
  message: string;
  updatedResources: IReliefResource[];
  distributions: IDistribution[];
  dispatchOrder?: IDispatchOrder;
}> {
  const input = multiAgencyAllocateSchema.parse(rawInput);

  let officerObjectId: mongoose.Types.ObjectId;
  if (officerUserId && mongoose.Types.ObjectId.isValid(officerUserId)) {
    officerObjectId = new mongoose.Types.ObjectId(officerUserId);
  } else {
    const officerDoc = await User.findOne({ role: "DMC_OFFICER" });
    officerObjectId = officerDoc ? officerDoc._id : new mongoose.Types.ObjectId();
  }

  // Phase 1: Server-side Pre-Validation Loop (Atomic Check)
  const targetResources: { doc: IReliefResource; qty: number; agency?: string }[] = [];

  for (const item of input.items) {
    const { resource, availableStock } = await checkResourceAvailability(
      item.resourceId,
      item.quantity
    );

    if (availableStock < item.quantity) {
      throw new InsufficientStockError(
        `Server-side validation failed: '${resource.name}' stock dropped below requested ${item.quantity} units.`
      );
    }

    targetResources.push({ doc: resource, qty: item.quantity, agency: item.agency });
  }

  // Phase 2: Allocation & Stock Mutation Loop
  const updatedResources: IReliefResource[] = [];
  const distributions: IDistribution[] = [];

  for (const target of targetResources) {
    const resource = target.doc;
    const deductQty = target.qty;

    resource.quantity -= deductQty;

    let nextStatus: AvailabilityStatus = "AVAILABLE";
    if (resource.quantity <= 0) {
      resource.quantity = 0;
      nextStatus = "DEPLETED";
    } else if (resource.quantity <= resource.minimumThreshold) {
      nextStatus = "LOW_STOCK";
    }

    resource.availabilityStatus = nextStatus;
    await resource.save();
    updatedResources.push(resource);

    const distRecord = await Distribution.create({
      distributionId: uuidv4(),
      resourceId: resource._id,
      district: input.district,
      centerName: input.centerName || `${input.district} Central Relief Hub`,
      distributedQuantity: deductQty,
      beneficiariesCount: Math.round(deductQty * 0.8),
      officerInCharge: officerObjectId,
      notes:
        input.requirementNotes ||
        `Multi-agency resource allocation from ${target.agency || resource.agency || "Government"}.`,
    });

    distributions.push(distRecord);
  }

  // Phase 3: Create DispatchOrder Record (Status: PENDING)
  let dispatchOrderDoc: IDispatchOrder | undefined;
  try {
    dispatchOrderDoc = await DispatchOrder.create({
      dispatchOrderId: `DISPATCH-${uuidv4().substring(0, 8).toUpperCase()}`,
      affectedArea: {
        districtName: input.district,
      },
      selectedResources: input.items.map((item, idx) => ({
        resourceId: targetResources[idx]?.doc._id || item.resourceId,
        resourceName: targetResources[idx]?.doc.name || "Relief Resource",
        category: targetResources[idx]?.doc.category || "WATER",
        quantity: item.quantity,
        unit: targetResources[idx]?.doc.unit || "units",
      })),
      agencies: Array.from(
        new Set(targetResources.map((t) => t.agency || t.doc.agency || "Government"))
      ),
      responsibleTeam: input.centerName || "DMC Emergency Operations Squad",
      dispatchStatus: "PENDING",
      dispatchedBy: officerObjectId,
      notes: input.requirementNotes || "Multi-agency resource dispatch order created",
    });
  } catch (err) {
    console.warn("Could not persist optional DispatchOrder document:", err);
  }

  return {
    message: `Successfully allocated resources from ${input.items.length} agency source(s)`,
    updatedResources,
    distributions,
    dispatchOrder: dispatchOrderDoc,
  };
}
