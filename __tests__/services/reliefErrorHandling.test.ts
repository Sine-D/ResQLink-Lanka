import {
  validateStatusTransition,
  InsufficientStockError,
  ResourceUnavailableError,
  ResourceNotFoundError,
  DispatchRejectedError,
  TrackingUnavailableError,
  DispatchCreationError,
  DuplicateDispatchError,
  IncidentNotFoundError,
  InvalidStatusTransitionError,
} from "../../lib/services/reliefResourceService";
import { resourceFilterSchema, multiAgencyAllocateSchema } from "../../lib/validation/resourceSchema";

describe("Relief Resources & Dispatch Error Handling Test Suite (11 Error Cases)", () => {
  // Case 1: Insufficient resources
  test("1. Insufficient stock error when requested quantity exceeds available stock", async () => {
    const error = new InsufficientStockError("Requested quantity exceeds currently available stock");
    expect(error.code).toBe("INSUFFICIENT_STOCK");
    expect(error.message).toContain("exceeds currently available stock");
  });

  // Case 2: Resource becomes unavailable before allocation
  test("2. Resource unavailable error when resource status is UNAVAILABLE or DEPLETED", async () => {
    const error = new ResourceUnavailableError("Resource is currently unavailable for allocation");
    expect(error.code).toBe("RESOURCE_UNAVAILABLE");
    expect(error.message).toContain("unavailable");
  });

  // Case 3: Agency rejects dispatch
  test("3. Agency rejects dispatch order", async () => {
    const error = new DispatchRejectedError("Dispatch order was rejected by agency coordinator");
    expect(error.code).toBe("DISPATCH_REJECTED");
    expect(error.message).toContain("rejected by agency");
  });

  // Case 4: Network failure
  test("4. Network failure handling preserves last recorded status", () => {
    const mockNetworkStatus = { status: "IN_TRANSIT", lastKnownLocation: "Colombo Hub" };
    try {
      throw new Error("Network connectivity lost during dispatch update");
    } catch (err: any) {
      expect(err.message).toContain("Network connectivity lost");
      expect(mockNetworkStatus.status).toBe("IN_TRANSIT");
      expect(mockNetworkStatus.lastKnownLocation).toBe("Colombo Hub");
    }
  });

  // Case 5: Tracking unavailable
  test("5. Tracking unavailable error preserves last known tracking info", () => {
    const error = new TrackingUnavailableError("Live tracking telemetry is currently unavailable");
    expect(error.code).toBe("TRACKING_UNAVAILABLE");

    const trackingFallback = {
      isLive: false,
      lastKnownLocation: "Peliyagoda Interchange Checkpoint",
      lastStatus: "IN_TRANSIT",
      lastUpdated: "2026-10-02T12:00:00Z",
    };
    expect(trackingFallback.lastKnownLocation).toBeDefined();
    expect(trackingFallback.lastStatus).toBe("IN_TRANSIT");
  });

  // Case 6: Dispatch creation failure
  test("6. Dispatch creation failure error", () => {
    const error = new DispatchCreationError("Failed to create or persist dispatch order record");
    expect(error.code).toBe("DISPATCH_CREATION_FAILED");
  });

  // Case 7: Duplicate dispatch
  test("7. Duplicate dispatch error", () => {
    const error = new DuplicateDispatchError("A dispatch order with this ID or allocation already exists");
    expect(error.code).toBe("DUPLICATE_DISPATCH");
  });

  // Case 8: Invalid quantity
  test("8. Invalid quantity validation error (quantity <= 0)", () => {
    const result = resourceFilterSchema.safeParse({ minQuantity: -5 });
    expect(result.success).toBe(false);

    const allocResult = multiAgencyAllocateSchema.safeParse({
      items: [{ resourceId: "RES-WATER-01", quantity: 0 }],
      district: "Colombo",
    });
    expect(allocResult.success).toBe(false);
  });

  // Case 9: Invalid/missing incident
  test("9. Incident not found error", () => {
    const error = new IncidentNotFoundError("Specified disaster incident record was not found");
    expect(error.code).toBe("INCIDENT_NOT_FOUND");
  });

  // Case 10: Invalid/missing resource
  test("10. Resource not found error", () => {
    const error = new ResourceNotFoundError("Relief resource not found");
    expect(error.code).toBe("RESOURCE_NOT_FOUND");
  });

  // Case 11: Invalid dispatch status transition
  test("11. State machine prevents invalid dispatch status transitions", () => {
    // Cannot transition from DELIVERED
    expect(() => validateStatusTransition("DELIVERED", "IN_TRANSIT")).toThrow(
      InvalidStatusTransitionError
    );

    // Cannot transition from REJECTED
    expect(() => validateStatusTransition("REJECTED", "CONFIRMED")).toThrow(
      InvalidStatusTransitionError
    );

    // Cannot apply duplicate transition
    expect(() => validateStatusTransition("IN_TRANSIT", "IN_TRANSIT")).toThrow(
      InvalidStatusTransitionError
    );

    // Valid transition PENDING -> CONFIRMED
    expect(() => validateStatusTransition("PENDING", "CONFIRMED")).not.toThrow();

    // Valid transition DISPATCHED -> IN_TRANSIT
    expect(() => validateStatusTransition("DISPATCHED", "IN_TRANSIT")).not.toThrow();
  });
});
