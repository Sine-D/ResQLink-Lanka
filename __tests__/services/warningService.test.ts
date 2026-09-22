import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
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

let mongoServer: MongoMemoryServer;
let testUser: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Warning.deleteMany({});
  await User.deleteMany({});
  await NotificationModel.deleteMany({});

  testUser = await User.create({
    name: "Officer Perera",
    email: "perera@dmc.gov.lk",
    passwordHash: "hashedsecret",
    role: "DMC_OFFICER",
    district: "Colombo",
  });

  // Reset gateway to default success mode
  const mockGateway = new notificationService.MockEmergencyGatewayClient();
  mockGateway.setMode("SUCCESS");
  notificationService.setGatewayClient(mockGateway);
});

describe("Warning Service & Logic Unit Tests (Member 1)", () => {
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

  test("creates a draft with correct default status (DRAFT and NOT_SENT)", async () => {
    const draft = await createDraft(sampleInput, testUser._id.toString());

    expect(draft).toBeDefined();
    expect(draft.warningId).toBeDefined();
    expect(draft.status).toBe("DRAFT");
    expect(draft.dispatchStatus).toBe("NOT_SENT");
    expect(draft.targetArea.estimatedReach).toBe(750000); // Colombo population lookup
    expect(draft.issuedBy.toString()).toBe(testUser._id.toString());
  });

  test("createDraft() NEVER calls notificationService (spy assertion)", async () => {
    const spyDispatch = jest.spyOn(notificationService, "dispatchNotification");

    await createDraft(sampleInput, testUser._id.toString());

    expect(spyDispatch).not.toHaveBeenCalled();
    spyDispatch.mockRestore();
  });

  test("issue() transitions DRAFT -> ACTIVE and persists before dispatch (assert call order)", async () => {
    const draft = await createDraft(sampleInput, testUser._id.toString());

    let persistedStatusBeforeDispatch = "";
    const originalDispatch = notificationService.dispatchNotification;
    const spyDispatch = jest
      .spyOn(notificationService, "dispatchNotification")
      .mockImplementation(async (warningDoc) => {
        // Assert that the document in DB is already saved as ACTIVE before dispatch runs
        const docInDb = await Warning.findById(warningDoc._id);
        persistedStatusBeforeDispatch = docInDb?.status || "";
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

    const draft = await createDraft(invalidInput, testUser._id.toString());

    await expect(issueWarning(draft.warningId)).rejects.toThrow(InvalidTargetAreaError);

    const docInDb = await Warning.findOne({ warningId: draft.warningId });
    expect(docInDb?.status).toBe("DRAFT");
    expect(docInDb?.dispatchStatus).toBe("NOT_SENT");
  });

  test("dispatch() when gateway throws 'unavailable' sets PENDING_DISPATCH and warning stays ACTIVE", async () => {
    const mockGateway = new notificationService.MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    notificationService.setGatewayClient(mockGateway);

    const draft = await createDraft(sampleInput, testUser._id.toString());
    const issued = await issueWarning(draft.warningId);

    expect(issued.status).toBe("ACTIVE");
    expect(issued.dispatchStatus).toBe("PENDING_DISPATCH");
  });

  test("dispatch() when gateway throws critical error sets FAILED, errorLog populated, warning stays ACTIVE", async () => {
    const mockGateway = new notificationService.MockEmergencyGatewayClient();
    mockGateway.setMode("CRITICAL_ERROR");
    notificationService.setGatewayClient(mockGateway);

    const draft = await createDraft(sampleInput, testUser._id.toString());
    const issued = await issueWarning(draft.warningId);

    expect(issued.status).toBe("ACTIVE");
    expect(issued.dispatchStatus).toBe("FAILED");

    const notificationRecord = await NotificationModel.findOne({ warningId: draft._id });
    expect(notificationRecord?.status).toBe("FAILED");
    expect(notificationRecord?.errorLog).toBeDefined();
  });

  test("retryWarningDispatch() only re-attempts notifications PENDING_DISPATCH or FAILED, updating status to SENT", async () => {
    const mockGateway = new notificationService.MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    notificationService.setGatewayClient(mockGateway);

    const draft = await createDraft(sampleInput, testUser._id.toString());
    await issueWarning(draft.warningId);

    // Switch gateway back to SUCCESS
    mockGateway.setMode("SUCCESS");
    const retried = await retryWarningDispatch(draft.warningId);

    expect(retried.dispatchStatus).toBe("SENT");
  });

  test("retryWarningDispatch() on an already-SENT warning is a no-op (idempotency)", async () => {
    const draft = await createDraft(sampleInput, testUser._id.toString());
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
      validUntil: new Date(2026, 5, 9), // validUntil < validFrom
    };

    expect(() => createWarningSchema.parse(invalidDateInput)).toThrow(ZodError);

    const shortInstructionsInput = {
      ...sampleInput,
      instructions: "Short", // < 10 chars
    };
    expect(() => createWarningSchema.parse(shortInstructionsInput)).toThrow(ZodError);

    const missingHazardInput = {
      ...sampleInput,
      hazardType: undefined,
    };
    expect(() => createWarningSchema.parse(missingHazardInput)).toThrow(ZodError);
  });

  test("getWarningById(), listActiveWarnings(), listAllWarnings() query helpers", async () => {
    const draft1 = await createDraft(sampleInput, testUser._id.toString());
    await issueWarning(draft1.warningId);

    const draft2 = await createDraft(
      { ...sampleInput, districtName: "Galle" },
      testUser._id.toString()
    );

    const fetched = await getWarningById(draft1.warningId);
    expect(fetched?.warningId).toBe(draft1.warningId);

    const activeWarnings = await listActiveWarnings();
    expect(activeWarnings.length).toBe(1);
    expect(activeWarnings[0].warningId).toBe(draft1.warningId);

    const colomboActive = await listActiveWarnings("Colombo");
    expect(colomboActive.length).toBe(1);

    const galleActive = await listActiveWarnings("Galle");
    expect(galleActive.length).toBe(0); // draft2 is still DRAFT

    const allWarnings = await listAllWarnings();
    expect(allWarnings.length).toBe(2);
  });

  test("issueWarning() throws WarningNotFoundError for non-existent UUID", async () => {
    await expect(issueWarning("non-existent-uuid")).rejects.toThrow(WarningNotFoundError);
  });
});
