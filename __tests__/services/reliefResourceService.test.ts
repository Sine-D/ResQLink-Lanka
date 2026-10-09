import mongoose from "mongoose";
import ReliefResource from "../../lib/models/ReliefResource";
import Distribution from "../../lib/models/Distribution";
import DispatchOrder from "../../lib/models/DispatchOrder";
import User from "../../lib/models/User";
import {
  listAvailableResources,
  checkResourceAvailability,
  allocateMultiAgencyResources,
  InsufficientStockError,
  ResourceUnavailableError,
  ResourceNotFoundError,
} from "../../lib/services/reliefResourceService";

jest.mock("../../lib/models/ReliefResource");
jest.mock("../../lib/models/Distribution");
jest.mock("../../lib/models/DispatchOrder");
jest.mock("../../lib/models/User");

describe("Backend Resource Management Service Tests", () => {
  let mockResourcesStore: any[] = [];
  let mockDistributionsStore: any[] = [];
  let mockDispatchOrdersStore: any[] = [];
  const dummyOfficerId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    mockResourcesStore = [
      {
        _id: "507f1f77bcf86cd799439099",
        resourceId: "RES-WATER-01",
        name: "Clean Bottled Water",
        category: "WATER",
        district: "Colombo",
        quantity: 5000,
        unit: "units",
        minimumThreshold: 500,
        agency: "Government",
        availabilityStatus: "AVAILABLE",
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      },
      {
        _id: "res_food_01",
        resourceId: "RES-FOOD-01",
        name: "Emergency Dry Rations",
        category: "FOOD",
        district: "Colombo",
        quantity: 2000,
        unit: "units",
        minimumThreshold: 200,
        agency: "NGO — Red Cross",
        availabilityStatus: "AVAILABLE",
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      },
      {
        _id: "res_med_01",
        resourceId: "RES-MED-01",
        name: "First Aid Kits",
        category: "MEDICAL",
        district: "Galle",
        quantity: 0,
        unit: "units",
        minimumThreshold: 50,
        agency: "Armed Forces",
        availabilityStatus: "UNAVAILABLE",
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      },
      {
        _id: "res_blanket_01",
        resourceId: "RES-BLANKET-01",
        name: "Thermal Blankets",
        category: "SHELTER",
        district: "Kandy",
        quantity: 0,
        unit: "units",
        minimumThreshold: 100,
        agency: "Red Cross",
        availabilityStatus: "DEPLETED",
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      },
    ];
    mockDistributionsStore = [];
    mockDispatchOrdersStore = [];

    (ReliefResource.find as jest.Mock).mockImplementation((query: any = {}) => {
      let result = [...mockResourcesStore];
      if (query.category) {
        result = result.filter((r) => r.category === query.category);
      }
      if (query.agency) {
        result = result.filter((r) =>
          query.agency instanceof RegExp ? query.agency.test(r.agency) : r.agency === query.agency
        );
      }
      if (query.district) {
        result = result.filter((r) =>
          query.district instanceof RegExp ? query.district.test(r.district) : r.district === query.district
        );
      }
      if (query.availabilityStatus) {
        result = result.filter((r) => r.availabilityStatus === query.availabilityStatus);
      }
      if (query.quantity && query.quantity.$gte !== undefined) {
        result = result.filter((r) => r.quantity >= query.quantity.$gte);
      }
      return {
        sort: () => Promise.resolve(result),
      };
    });

    (ReliefResource.findOne as jest.Mock).mockImplementation((query: any) => {
      const found = mockResourcesStore.find(
        (r) => r.resourceId === query.resourceId || r.name === query.name
      );
      return Promise.resolve(found || null);
    });

    (ReliefResource.findById as jest.Mock).mockImplementation((id: string) => {
      const found = mockResourcesStore.find((r) => r._id === id);
      return Promise.resolve(found || null);
    });

    (Distribution.create as jest.Mock).mockImplementation((data: any) => {
      const doc = { ...data, _id: `dist_${Math.random()}` };
      mockDistributionsStore.push(doc);
      return Promise.resolve(doc);
    });

    (DispatchOrder.create as jest.Mock).mockImplementation((data: any) => {
      const doc = { ...data, _id: `dispatch_${Math.random()}` };
      mockDispatchOrdersStore.push(doc);
      return Promise.resolve(doc);
    });

    (User.findOne as jest.Mock).mockResolvedValue({
      _id: dummyOfficerId,
      name: "Officer Silva",
      role: "DMC_OFFICER",
    });
  });

  // ==========================================
  // Section 1: listAvailableResources filters
  // ==========================================
  test("1. Retrieve available resources with filtering by category", async () => {
    const waterResources = await listAvailableResources({ category: "WATER" });
    expect(waterResources.length).toBe(1);
    expect(waterResources[0].resourceId).toBe("RES-WATER-01");
  });

  test("1.1 Retrieve available resources with no filters (default parameter)", async () => {
    const all = await listAvailableResources();
    expect(all.length).toBe(4);
  });

  test("1.2 Retrieve available resources filtered by agency", async () => {
    const govResources = await listAvailableResources({ agency: "Government" });
    expect(govResources.length).toBe(1);
    expect(govResources[0].resourceId).toBe("RES-WATER-01");
  });

  test("1.3 Retrieve available resources filtered by district", async () => {
    const colomboResources = await listAvailableResources({ district: "Colombo" });
    expect(colomboResources.length).toBe(2);
  });

  test("1.4 Retrieve available resources filtered by availability status", async () => {
    const available = await listAvailableResources({ status: "AVAILABLE" });
    expect(available.length).toBe(2);
  });

  test("1.5 Retrieve available resources filtered by minQuantity", async () => {
    const highStock = await listAvailableResources({ minQuantity: 3000 });
    expect(highStock.length).toBe(1);
    expect(highStock[0].resourceId).toBe("RES-WATER-01");
  });

  test("1.6 Retrieve available resources with multiple combined filters", async () => {
    const filtered = await listAvailableResources({
      category: "FOOD",
      agency: "NGO — Red Cross",
      district: "Colombo",
      status: "AVAILABLE",
      minQuantity: 1000,
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].resourceId).toBe("RES-FOOD-01");
  });

  // ==========================================
  // Section 2: checkResourceAvailability
  // ==========================================
  test("2. Check available quantity returns stock details when sufficient", async () => {
    const { availableStock } = await checkResourceAvailability("RES-WATER-01", 1500);
    expect(availableStock).toBe(5000);
  });

  test("2.1 Resolves resource by MongoDB ObjectId when resourceId query does not match", async () => {
    const validObjectId = "507f1f77bcf86cd799439099";
    const { resource } = await checkResourceAvailability(validObjectId, 100);
    expect(resource.resourceId).toBe("RES-WATER-01");
  });

  test("2.2 Throws ResourceNotFoundError when valid ObjectId does not match any resource", async () => {
    const unknownObjectId = "507f1f77bcf86cd799439000";
    await expect(checkResourceAvailability(unknownObjectId, 10)).rejects.toThrow(
      ResourceNotFoundError
    );
  });

  test("3. Throws InsufficientStockError when requested quantity exceeds available stock (Server-side validation)", async () => {
    await expect(checkResourceAvailability("RES-WATER-01", 10000)).rejects.toThrow(
      InsufficientStockError
    );
  });

  test("4. Throws ResourceUnavailableError when resource status is UNAVAILABLE or DEPLETED", async () => {
    await expect(checkResourceAvailability("RES-MED-01", 10)).rejects.toThrow(
      ResourceUnavailableError
    );

    // Also verify DEPLETED branch
    await expect(checkResourceAvailability("RES-BLANKET-01", 10)).rejects.toThrow(
      ResourceUnavailableError
    );
  });

  test("5. Throws ResourceNotFoundError when resource does not exist", async () => {
    await expect(checkResourceAvailability("NON-EXISTENT-ID", 10)).rejects.toThrow(
      ResourceNotFoundError
    );
  });

  // ==========================================
  // Section 3: allocateMultiAgencyResources
  // ==========================================
  test("6. Allocate multi-agency resources from multiple agencies for one requirement", async () => {
    const payload = {
      items: [
        { resourceId: "RES-WATER-01", quantity: 400, agency: "Government — DMC Main Warehouse" },
        { resourceId: "RES-FOOD-01", quantity: 300, agency: "NGO — Red Cross Relief Fleet" },
      ],
      district: "Colombo",
      centerName: "Colombo Central Relief Center",
      requirementNotes: "Multi-agency disaster response allocation for 700 Water requirement",
    };

    const result = await allocateMultiAgencyResources(payload, dummyOfficerId);
    expect(result.updatedResources.length).toBe(2);
    expect(result.distributions.length).toBe(2);
    expect(result.dispatchOrder).toBeDefined();

    // Verify stock deductions (400 + 300 = 700 total)
    expect(mockResourcesStore[0].quantity).toBe(4600); // 5000 - 400
    expect(mockResourcesStore[1].quantity).toBe(1700); // 2000 - 300
  });

  test("7. Server-side pre-validation prevents partial allocation if any resource has insufficient stock", async () => {
    const payload = {
      items: [
        { resourceId: "RES-WATER-01", quantity: 100, agency: "Government" },
        { resourceId: "RES-FOOD-01", quantity: 99999, agency: "NGO — Red Cross" },
      ],
      district: "Colombo",
    };

    await expect(allocateMultiAgencyResources(payload, dummyOfficerId)).rejects.toThrow(
      InsufficientStockError
    );

    // Ensure Water stock was NOT modified due to atomic pre-validation check
    expect(mockResourcesStore[0].quantity).toBe(5000);
  });

  test("7.1 Server-side validation throws when availableStock drops unexpectedly below item quantity", async () => {
    let readCount = 0;
    const fluctuatingResource = {
      _id: "res_fluctuate",
      resourceId: "RES-FLUCTUATE",
      name: "Fluctuating Resource",
      category: "WATER",
      district: "Colombo",
      minimumThreshold: 50,
      agency: "Government",
      availabilityStatus: "AVAILABLE",
      get quantity() {
        readCount++;
        return readCount === 1 ? 500 : 10;
      },
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockResourcesStore.push(fluctuatingResource);

    const payload = {
      items: [{ resourceId: "RES-FLUCTUATE", quantity: 100 }],
      district: "Colombo",
    };

    await expect(allocateMultiAgencyResources(payload, dummyOfficerId)).rejects.toThrow(
      "Server-side validation failed: 'Fluctuating Resource' stock dropped below requested 100 units."
    );
  });

  test("8. Correctly updates status to LOW_STOCK when quantity drops to threshold", async () => {
    // RES-FOOD-01 has 2000 qty and 200 threshold. Deduct 1850 -> 150 <= 200
    const payload = {
      items: [{ resourceId: "RES-FOOD-01", quantity: 1850 }],
      district: "Colombo",
    };

    const result = await allocateMultiAgencyResources(payload, dummyOfficerId);
    expect(result.updatedResources[0].quantity).toBe(150);
    expect(result.updatedResources[0].availabilityStatus).toBe("LOW_STOCK");
  });

  test("9. Correctly updates status to DEPLETED when quantity drops to zero", async () => {
    // RES-FOOD-01 has 2000 qty. Deduct all 2000 -> 0 <= 0
    const payload = {
      items: [{ resourceId: "RES-FOOD-01", quantity: 2000 }],
      district: "Colombo",
    };

    const result = await allocateMultiAgencyResources(payload, dummyOfficerId);
    expect(result.updatedResources[0].quantity).toBe(0);
    expect(result.updatedResources[0].availabilityStatus).toBe("DEPLETED");
  });

  test("10. Uses default fallback values when centerName, requirementNotes, or item agency are omitted", async () => {
    mockResourcesStore[0].agency = undefined; // Force fallback to 'Government'
    const payload = {
      items: [{ resourceId: "RES-WATER-01", quantity: 100 }],
      district: "Gampaha",
    };

    const result = await allocateMultiAgencyResources(payload, dummyOfficerId);
    expect(result.distributions[0].centerName).toBe("Gampaha Central Relief Hub");
    expect(result.distributions[0].notes).toContain("Multi-agency resource allocation from Government");
    expect(result.dispatchOrder?.responsibleTeam).toBe("DMC Emergency Operations Squad");
    expect(result.dispatchOrder?.notes).toBe("Multi-agency resource dispatch order created");
  });

  test("10.1 Uses fallback defaults in selectedResources when resource fields are missing", async () => {
    const sparseResource = {
      _id: "res_sparse",
      resourceId: "RES-SPARSE",
      district: "Colombo",
      quantity: 500,
      minimumThreshold: 50,
      availabilityStatus: "AVAILABLE",
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockResourcesStore.push(sparseResource);

    const payload = {
      items: [{ resourceId: "RES-SPARSE", quantity: 50 }],
      district: "Colombo",
    };

    const result = await allocateMultiAgencyResources(payload, dummyOfficerId);
    expect(result.dispatchOrder?.selectedResources[0].resourceName).toBe("Relief Resource");
    expect(result.dispatchOrder?.selectedResources[0].category).toBe("WATER");
    expect(result.dispatchOrder?.selectedResources[0].unit).toBe("units");
  });

  test("11. Fallback officer ObjectId when officerUserId is invalid/omitted and DMC officer exists", async () => {
    const payload = {
      items: [{ resourceId: "RES-WATER-01", quantity: 50 }],
      district: "Colombo",
    };

    const result = await allocateMultiAgencyResources(payload, "invalid-user-id");
    expect(result.distributions[0].officerInCharge).toBeDefined();
    expect(User.findOne).toHaveBeenCalledWith({ role: "DMC_OFFICER" });
  });

  test("12. Fallback officer ObjectId when officerUserId is invalid and no DMC officer exists", async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);
    const payload = {
      items: [{ resourceId: "RES-WATER-01", quantity: 50 }],
      district: "Colombo",
    };

    const result = await allocateMultiAgencyResources(payload, "");
    expect(result.distributions[0].officerInCharge).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  test("13. Handles DispatchOrder creation failure gracefully and logs warning", async () => {
    (DispatchOrder.create as jest.Mock).mockRejectedValueOnce(
      new Error("DispatchOrder DB write failure")
    );
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const payload = {
      items: [{ resourceId: "RES-WATER-01", quantity: 50 }],
      district: "Colombo",
    };

    const result = await allocateMultiAgencyResources(payload, dummyOfficerId);
    expect(result.dispatchOrder).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // ==========================================
  // Section 4: Custom Error Classes
  // ==========================================
  test("14. Custom Error classes instantiate with correct default messages and error codes", () => {
    const stockErr = new InsufficientStockError();
    expect(stockErr.message).toBe("Requested quantity exceeds currently available stock");
    expect(stockErr.code).toBe("INSUFFICIENT_STOCK");
    expect(stockErr.name).toBe("InsufficientStockError");

    const unavailErr = new ResourceUnavailableError();
    expect(unavailErr.message).toBe("Resource is currently unavailable for allocation");
    expect(unavailErr.code).toBe("RESOURCE_UNAVAILABLE");
    expect(unavailErr.name).toBe("ResourceUnavailableError");

    const notFoundErr = new ResourceNotFoundError();
    expect(notFoundErr.message).toBe("Relief resource not found");
    expect(notFoundErr.code).toBe("RESOURCE_NOT_FOUND");
    expect(notFoundErr.name).toBe("ResourceNotFoundError");
  });
});
