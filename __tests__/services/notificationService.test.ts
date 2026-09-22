import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Warning from "../../lib/models/Warning";
import NotificationModel from "../../lib/models/Notification";
import User from "../../lib/models/User";
import {
  dispatchNotification,
  retryNotificationDispatch,
  setGatewayClient,
  MockEmergencyGatewayClient,
  GatewayUnavailableError,
  GatewayCriticalError,
  IGatewayClient,
} from "../../lib/services/notificationService";
import { v4 as uuidv4 } from "uuid";

let mongoServer: MongoMemoryServer;

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
  await NotificationModel.deleteMany({});
  await User.deleteMany({});
});

describe("Notification Service Unit Tests", () => {
  const dummyPolygon = {
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

  async function createTestWarning() {
    const user = await User.create({
      name: "Officer Silva",
      email: "silva@dmc.gov.lk",
      passwordHash: "hashedpass",
      role: "DMC_OFFICER",
      district: "Colombo",
    });

    const warning = await Warning.create({
      warningId: uuidv4(),
      hazardType: "Flood",
      severity: "High",
      status: "ACTIVE",
      targetArea: {
        districtName: "Colombo",
        coordinates: dummyPolygon,
        estimatedReach: 750000,
      },
      instructions: "Move to higher ground immediately.",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 86400000),
      issuedBy: user._id,
      dispatchStatus: "NOT_SENT",
    });

    return { warning, user };
  }

  test("dispatchNotification() success path creates SENT notification and sets warning.dispatchStatus = SENT", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("SUCCESS");
    setGatewayClient(mockGateway);

    const { warning } = await createTestWarning();

    const notif = await dispatchNotification(warning, "BOTH");

    expect(notif).toBeDefined();
    expect(notif.status).toBe("SENT");
    expect(notif.sentAt).not.toBeNull();
    expect(notif.errorLog).toBeNull();

    const updatedWarning = await Warning.findById(warning._id);
    expect(updatedWarning?.dispatchStatus).toBe("SENT");
  });

  test("dispatchNotification() when gateway throws GatewayUnavailableError -> sets PENDING_DISPATCH", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    setGatewayClient(mockGateway);

    const { warning } = await createTestWarning();

    const notif = await dispatchNotification(warning, "SMS");

    expect(notif.status).toBe("PENDING_DISPATCH");
    expect(notif.errorLog).toContain("[UNAVAILABLE]");

    const updatedWarning = await Warning.findById(warning._id);
    expect(updatedWarning?.dispatchStatus).toBe("PENDING_DISPATCH");
    expect(updatedWarning?.status).toBe("ACTIVE"); // Stays active
  });

  test("dispatchNotification() when gateway throws GatewayCriticalError -> sets FAILED and populates errorLog", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("CRITICAL_ERROR");
    setGatewayClient(mockGateway);

    const { warning } = await createTestWarning();

    const notif = await dispatchNotification(warning, "PUSH");

    expect(notif.status).toBe("FAILED");
    expect(notif.errorLog).toContain("[CRITICAL_FAILURE]");

    const updatedWarning = await Warning.findById(warning._id);
    expect(updatedWarning?.dispatchStatus).toBe("FAILED");
    expect(updatedWarning?.status).toBe("ACTIVE"); // Warning stays ACTIVE but flagged
  });

  test("retryNotificationDispatch() re-attempts pending/failed dispatch and succeeds", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    setGatewayClient(mockGateway);

    const { warning } = await createTestWarning();
    await dispatchNotification(warning);

    // Switch gateway to SUCCESS and retry
    mockGateway.setMode("SUCCESS");
    const retriedNotif = await retryNotificationDispatch(warning.warningId);

    expect(retriedNotif?.status).toBe("SENT");

    const updatedWarning = await Warning.findOne({ warningId: warning.warningId });
    expect(updatedWarning?.dispatchStatus).toBe("SENT");
  });

  test("retryNotificationDispatch() on an already-SENT warning is idempotent (no-op)", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("SUCCESS");
    setGatewayClient(mockGateway);

    const { warning } = await createTestWarning();
    const originalNotif = await dispatchNotification(warning);

    const spySend = jest.spyOn(mockGateway, "send");

    const retriedNotif = await retryNotificationDispatch(warning.warningId);

    expect(retriedNotif?.status).toBe("SENT");
    expect(spySend).not.toHaveBeenCalled(); // No duplicate transmission call
  });
});
