import Warning from "../../lib/models/Warning";
import User from "../../lib/models/User";
import NotificationModel from "../../lib/models/Notification";
import {
  createDraft,
  issueWarning,
  retryWarningDispatch,
  getWarningById,
  listActiveWarnings,
  listAllWarnings,
  InvalidTargetAreaError,
  WarningNotFoundError,
} from "../../lib/services/warningService";
import * as notificationService from "../../lib/services/notificationService";
import { createWarningSchema } from "../../lib/validation/warningSchema";
import { ZodError } from "zod";

jest.mock("../../lib/models/Warning");
jest.mock("../../lib/models/User");
jest.mock("../../lib/models/Notification");

describe("Warning Service & Logic Unit Tests (Member 1)", () => {
  let mockWarningsStore: any[] = [];
  let mockNotificationsStore: any[] = [];
  const dummyUserId = "507f1f77bcf86cd799439011";

  const validPolygon = {
    type: "Polygon" as const,
    coordinates: [
      [
        [79.86, 6.92],
        [79.88, 6.92],
        [79.88, 6.94],
        [79.86, 6.94],
        [79.86, 6.92],
      ],
    ],
  };

  const sampleInput = {
    hazardType: "Flood" as const,
    severity: "High" as const,
    districtName: "Colombo",
    coordinates: validPolygon,
    instructions: "Evacuate low-lying river areas along Kelani River immediately.",
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24), // +24h
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWarningsStore = [];
    mockNotificationsStore = [];

    const mockGateway = new notificationService.MockEmergencyGatewayClient();
    mockGateway.setMode("SUCCESS");
    notificationService.setGatewayClient(mockGateway);

    // Mock Warning constructor & methods
    (Warning as unknown as jest.Mock).mockImplementation((data: any) => {
      const instance = {
        ...data,
        _id: data._id || `id_${Math.random().toString(36).substring(2, 9)}`,
        save: jest.fn().mockImplementation(function (this: any) {
          const idx = mockWarningsStore.findIndex((w) => w.warningId === this.warningId);
          if (idx >= 0) {
            mockWarningsStore[idx] = { ...this };
          } else {
            mockWarningsStore.push({ ...this });
          }
          return Promise.resolve(this);
        }),
      };
      return instance;
    });

    (Warning.findOne as jest.Mock).mockImplementation((query: any) => {
      const found = mockWarningsStore.find(
        (w) => w.warningId === query.warningId || w._id?.toString() === query._id?.toString()
      );
      if (!found) {
        return {
          populate: jest.fn().mockResolvedValue(null),
          then: (cb: any) => cb(null),
        };
      }
      const wrapped = {
        ...found,
        save: jest.fn().mockImplementation(function (this: any) {
          const idx = mockWarningsStore.findIndex((w) => w.warningId === found.warningId);
          if (idx >= 0) {
            mockWarningsStore[idx] = { ...this, ...found };
          }
          return Promise.resolve(found);
        }),
        populate: jest.fn().mockResolvedValue({
          ...found,
          issuedBy: { _id: dummyUserId, name: "Officer Perera", email: "perera@dmc.gov.lk", role: "DMC_OFFICER" },
        }),
      };
      return wrapped;
    });

    (Warning.findById as jest.Mock).mockImplementation((id: any) => {
      const found = mockWarningsStore.find((w) => w._id?.toString() === id?.toString() || w._id === id);
      return Promise.resolve(found || null);
    });

    (Warning.findByIdAndUpdate as jest.Mock).mockImplementation((id: any, update: any) => {
      const target = mockWarningsStore.find((w) => w._id?.toString() === id?.toString() || w._id === id);
      if (target) {
        Object.assign(target, update);
      }
      return Promise.resolve(target);
    });

    (Warning.find as jest.Mock).mockImplementation((query: any) => {
      let results = [...mockWarningsStore];
      if (query.status) {
        results = results.filter((w) => w.status === query.status);
      }
      if (query["targetArea.districtName"]) {
        const regex = query["targetArea.districtName"];
        results = results.filter((w) => regex.test(w.targetArea.districtName));
      }
      return {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(results),
      };
    });

    // Mock NotificationModel
    (NotificationModel as unknown as jest.Mock).mockImplementation((data: any) => {
      const instance = {
        ...data,
        save: jest.fn().mockImplementation(function (this: any) {
          const idx = mockNotificationsStore.findIndex((n) => n.notificationId === this.notificationId);
          if (idx >= 0) {
            mockNotificationsStore[idx] = { ...this };
          } else {
            mockNotificationsStore.push({ ...this });
          }
          return Promise.resolve(this);
        }),
      };
      return instance;
    });

    (NotificationModel.findOne as jest.Mock).mockImplementation((query: any) => {
      const found = mockNotificationsStore.find(
        (n) => n.warningId?.toString() === query.warningId?.toString()
      );
      return Promise.resolve(found || null);
    });
  });

  test("creates a draft with correct default status (DRAFT and NOT_SENT)", async () => {
    const draft = await createDraft(sampleInput, dummyUserId);

    expect(draft).toBeDefined();
    expect(draft.warningId).toBeDefined();
    expect(draft.status).toBe("DRAFT");
    expect(draft.dispatchStatus).toBe("NOT_SENT");
    expect(draft.targetArea.estimatedReach).toBe(750000); // Colombo population lookup
  });

  test("createDraft() NEVER calls notificationService (spy assertion)", async () => {
    const spyDispatch = jest.spyOn(notificationService, "dispatchNotification");

    await createDraft(sampleInput, dummyUserId);

    expect(spyDispatch).not.toHaveBeenCalled();
    spyDispatch.mockRestore();
  });

  test("issue() transitions DRAFT -> ACTIVE and persists before dispatch (assert call order)", async () => {
    const draft = await createDraft(sampleInput, dummyUserId);

    let persistedStatusBeforeDispatch = "";
    const originalDispatch = notificationService.dispatchNotification;
    const spyDispatch = jest
      .spyOn(notificationService, "dispatchNotification")
      .mockImplementation(async (warningDoc) => {
        const stored = mockWarningsStore.find((w) => w.warningId === warningDoc.warningId);
        persistedStatusBeforeDispatch = stored?.status || "";
        return originalDispatch(warningDoc);
      });

    const issued = await issueWarning(draft.warningId);

    expect(spyDispatch).toHaveBeenCalledTimes(1);
    expect(persistedStatusBeforeDispatch).toBe("ACTIVE");
    expect(issued.status).toBe("ACTIVE");
    expect(issued.dispatchStatus).toBe("SENT");

    spyDispatch.mockRestore();
  });

  test("issue() throws InvalidTargetAreaError for an unsupported/invalid district and does NOT update record beyond DRAFT", async () => {
    const invalidInput = {
      ...sampleInput,
      districtName: "Unsupported_District",
    };

    const draft = await createDraft(invalidInput, dummyUserId);

    await expect(issueWarning(draft.warningId)).rejects.toThrow(InvalidTargetAreaError);

    const stored = mockWarningsStore.find((w) => w.warningId === draft.warningId);
    expect(stored?.status).toBe("DRAFT");
    expect(stored?.dispatchStatus).toBe("NOT_SENT");
  });

  test("dispatch() when gateway throws 'unavailable' sets PENDING_DISPATCH and warning stays ACTIVE", async () => {
    const mockGateway = new notificationService.MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    notificationService.setGatewayClient(mockGateway);

    const draft = await createDraft(sampleInput, dummyUserId);
    const issued = await issueWarning(draft.warningId);

    expect(issued.status).toBe("ACTIVE");
    expect(issued.dispatchStatus).toBe("PENDING_DISPATCH");
  });

  test("dispatch() when gateway throws critical error sets FAILED, errorLog populated, warning stays ACTIVE", async () => {
    const mockGateway = new notificationService.MockEmergencyGatewayClient();
    mockGateway.setMode("CRITICAL_ERROR");
    notificationService.setGatewayClient(mockGateway);

    const draft = await createDraft(sampleInput, dummyUserId);
    const issued = await issueWarning(draft.warningId);

    expect(issued.status).toBe("ACTIVE");
    expect(issued.dispatchStatus).toBe("FAILED");

    const notificationRecord = mockNotificationsStore.find((n) => n.warningId?.toString() === draft._id?.toString());
    expect(notificationRecord?.status).toBe("FAILED");
    expect(notificationRecord?.errorLog).toBeDefined();
  });

  test("retryWarningDispatch() only re-attempts notifications PENDING_DISPATCH or FAILED, updating status to SENT", async () => {
    const mockGateway = new notificationService.MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    notificationService.setGatewayClient(mockGateway);

    const draft = await createDraft(sampleInput, dummyUserId);
    await issueWarning(draft.warningId);

    // Switch gateway back to SUCCESS
    mockGateway.setMode("SUCCESS");
    const retried = await retryWarningDispatch(draft.warningId);

    expect(retried.dispatchStatus).toBe("SENT");
  });

  test("retryWarningDispatch() on an already-SENT warning is a no-op (idempotency)", async () => {
    const draft = await createDraft(sampleInput, dummyUserId);
    await issueWarning(draft.warningId);

    const spyDispatch = jest.spyOn(notificationService, "retryNotificationDispatch");

    await retryWarningDispatch(draft.warningId);

    expect(spyDispatch).toHaveBeenCalledWith(draft.warningId);
    spyDispatch.mockRestore();
  });

  test("Zod schema rejects validUntil <= validFrom, empty instructions, and missing hazardType", () => {
    const invalidDateInput = {
      ...sampleInput,
      validFrom: new Date(2026, 5, 10),
      validUntil: new Date(2026, 5, 9),
    };

    expect(() => createWarningSchema.parse(invalidDateInput)).toThrow(ZodError);

    const shortInstructionsInput = {
      ...sampleInput,
      instructions: "Short",
    };
    expect(() => createWarningSchema.parse(shortInstructionsInput)).toThrow(ZodError);

    const missingHazardInput = {
      ...sampleInput,
      hazardType: undefined,
    };
    expect(() => createWarningSchema.parse(missingHazardInput)).toThrow(ZodError);
  });

  test("getWarningById(), listActiveWarnings(), listAllWarnings() query helpers", async () => {
    const draft1 = await createDraft(sampleInput, dummyUserId);
    await issueWarning(draft1.warningId);

    const draft2 = await createDraft(
      { ...sampleInput, districtName: "Galle" },
      dummyUserId
    );

    const fetched = await getWarningById(draft1.warningId);
    expect(fetched?.warningId).toBe(draft1.warningId);

    const activeWarnings = await listActiveWarnings();
    expect(activeWarnings.length).toBe(1);
    expect(activeWarnings[0].warningId).toBe(draft1.warningId);

    const colomboActive = await listActiveWarnings("Colombo");
    expect(colomboActive.length).toBe(1);

    const galleActive = await listActiveWarnings("Galle");
    expect(galleActive.length).toBe(0);

    const allWarnings = await listAllWarnings();
    expect(allWarnings.length).toBe(2);
  });

  test("issueWarning() throws WarningNotFoundError for non-existent UUID", async () => {
    await expect(issueWarning("non-existent-uuid")).rejects.toThrow(WarningNotFoundError);
  });
});
