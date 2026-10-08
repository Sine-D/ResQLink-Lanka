import ReliefResource from "../../lib/models/ReliefResource";
import Distribution from "../../lib/models/Distribution";
import DispatchOrder from "../../lib/models/DispatchOrder";
import User from "../../lib/models/User";
import mongoose from "mongoose";
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
  const dummyOfficerId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    mockResourcesStore = [
      {
        _id: new mongoose.Types.ObjectId("507f191e810c19729de860ea"),
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
        _id: new mongoose.Types.ObjectId("507f191e810c19729de860eb"),
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
        _id: new mongoose.Types.ObjectId("507f191e810c19729de860ec"),
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
    ];
    mockDistributionsStore = [];
    mockDispatchOrdersStore = [];

    (ReliefResource.find as jest.Mock).mockImplementation((query: any = {}) => {
      let result = [...mockResourcesStore];
      if (query.category) {
        result = result.filter((r) => r.category === query.category);
      }
      if (query.agency) {
        result = result.filter((r) => query.agency.test(r.agency));
      }
      if (query.district) {
        result = result.filter((r) => query.district.test(r.district));
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

    (ReliefResource.findById as jest.Mock).mockImplementation((id: any) => {
      const found = mockResourcesStore.find(
        (r) => r._id.toString() === id.toString()
      );
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

  test("1. Retrieve available resources with filtering by category, agency, district, status, minQuantity", async () => {
    const waterResources = await listAvailableResources({ category: "WATER" });
    expect(waterResources.length).toBe(1);
    expect(waterResources[0].resourceId).toBe("RES-WATER-01");

    const filtered = await listAvailableResources({
      agency: "Government",
      district: "Colombo",
      status: "AVAILABLE",
      minQuantity: 1000,
    });
    expect(filtered.length).toBe(1);
  });

  test("2. Check available quantity returns stock details when sufficient", async () => {
    const { availableStock } = await checkResourceAvailability("RES-WATER-01", 1500);
    expect(availableStock).toBe(5000);
  });

  test("3. Finds resource by MongoDB ObjectId when resourceId is an ObjectId", async () => {
    const validObjectId = "507f191e810c19729de860ea";
    const { availableStock } = await checkResourceAvailability(validObjectId, 100);
    expect(availableStock).toBe(5000);
  });

  test("4. Throws InsufficientStockError when requested quantity exceeds available stock (Server-side validation)", async () => {
    await expect(checkResourceAvailability("RES-WATER-01", 10000)).rejects.toThrow(
      InsufficientStockError
    );
  });

  test("5. Throws ResourceUnavailableError when resource status is UNAVAILABLE or DEPLETED", async () => {
    await expect(checkResourceAvailability("RES-MED-01", 10)).rejects.toThrow(
      ResourceUnavailableError
    );
  });

  test("6. Throws ResourceNotFoundError when resource does not exist", async () => {
    await expect(checkResourceAvailability("NON-EXISTENT-ID", 10)).rejects.toThrow(
      ResourceNotFoundError
    );
  });

  test("7. Allocate multi-agency resources from multiple agencies for one requirement (e.g. 700 Water = 400 Agency A + 300 Agency B)", async () => {
    const payload = {
      items: [
        { resourceId: "RES-WATER-01", quantity: 400, agency: "Government — DMC Main Warehouse" },
        { resourceId: "RES-FOOD-01", quantity: 300, agency: "NGO — Red Cross Relief Fleet" },
      ],
      district: "Colombo",
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

  test("8. Sets availabilityStatus to LOW_STOCK or DEPLETED when stock decreases below threshold or to zero", async () => {
    const lowStockPayload = {
      items: [{ resourceId: "RES-FOOD-01", quantity: 1850, agency: "NGO — Red Cross" }],
      district: "Colombo",
    };
    const resLow = await allocateMultiAgencyResources(lowStockPayload, dummyOfficerId);
    expect(resLow.updatedResources[0].availabilityStatus).toBe("LOW_STOCK");

    const depletedPayload = {
      items: [{ resourceId: "RES-FOOD-01", quantity: 150, agency: "NGO — Red Cross" }],
      district: "Colombo",
    };
    const resDepleted = await allocateMultiAgencyResources(depletedPayload, "");
    expect(resDepleted.updatedResources[0].availabilityStatus).toBe("DEPLETED");
  });

  test("9. Server-side pre-validation prevents partial allocation if any resource has insufficient stock", async () => {
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

    expect(mockResourcesStore[0].quantity).toBe(5000);
  });
});
