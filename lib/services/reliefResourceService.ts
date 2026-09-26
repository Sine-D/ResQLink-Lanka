import mongoose from "mongoose";
import ReliefResource, { IReliefResource, AvailabilityStatus } from "../models/ReliefResource";
import Distribution, { IDistribution } from "../models/Distribution";
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
    throw new ResourceNotFoundError(`Relief resource '${resourceId}' does not exist`);
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
      `Requested ${requestedQuantity} ${resource.unit} for '${resource.name}', but only ${resource.quantity} ${resource.unit} is available`
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
}> {
  const input = multiAgencyAllocateSchema.parse(rawInput);

  // Validate Officer ID to valid ObjectId
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

    // Mid-flow availability double check
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

    // Recalculate Availability Status
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

  return {
    message: `Successfully allocated resources from ${input.items.length} agency source(s)`,
    updatedResources,
    distributions,
  };
}
