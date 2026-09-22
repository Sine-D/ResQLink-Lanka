import Warning from "../../lib/models/Warning";
import NotificationModel from "../../lib/models/Notification";
import {
  dispatchNotification,
  retryNotificationDispatch,
  setGatewayClient,
  MockEmergencyGatewayClient,
} from "../../lib/services/notificationService";

// Mock Mongoose models for offline-resilient unit testing
jest.mock("../../lib/models/Notification");
jest.mock("../../lib/models/Warning");

describe("Notification Service Unit Tests", () => {
  let mockNotificationsStore: any[] = [];
  let mockWarningsStore: any[] = [];

  const dummyWarning: any = {
    _id: "warning_obj_id_123",
    warningId: "test-uuid-1234",
    hazardType: "Flood",
    severity: "High",
    status: "ACTIVE",
    targetArea: {
      districtName: "Colombo",
      coordinates: {
        type: "Polygon",
        coordinates: [
          [
            [79.86, 6.92],
            [79.88, 6.92],
            [79.88, 6.94],
            [79.86, 6.94],
            [79.86, 6.92],
          ],
        ],
      },
      estimatedReach: 750000,
    },
    instructions: "Evacuate immediately to higher ground.",
    dispatchStatus: "NOT_SENT",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationsStore = [];
    mockWarningsStore = [{ ...dummyWarning }];

    // Setup NotificationModel mock behavior
    (NotificationModel.findOne as jest.Mock).mockImplementation((query: any) => {
      const found = mockNotificationsStore.find(
        (n) => n.warningId === query.warningId || n.warningId === query.warningId?.toString()
      );
      return Promise.resolve(found || null);
    });

    // Mock constructor / save for new NotificationModel
    (NotificationModel as unknown as jest.Mock).mockImplementation((data: any) => {
      const instance = {
        ...data,
        save: jest.fn().mockImplementation(function (this: any) {
          const index = mockNotificationsStore.findIndex((n) => n.notificationId === this.notificationId);
          if (index >= 0) {
            mockNotificationsStore[index] = { ...this };
          } else {
            mockNotificationsStore.push({ ...this });
          }
          return Promise.resolve(this);
        }),
      };
      return instance;
    });

    // Setup Warning model mocks
    (Warning.findOne as jest.Mock).mockImplementation((query: any) => {
      const found = mockWarningsStore.find((w) => w.warningId === query.warningId || w._id === query._id);
      return Promise.resolve(found ? { ...found } : null);
    });

    (Warning.findById as jest.Mock).mockImplementation((id: any) => {
      const found = mockWarningsStore.find((w) => w._id === id);
      return Promise.resolve(found ? { ...found } : null);
    });

    (Warning.findByIdAndUpdate as jest.Mock).mockImplementation((id: any, update: any) => {
      const target = mockWarningsStore.find((w) => w._id === id);
      if (target) {
        Object.assign(target, update);
      }
      return Promise.resolve(target);
    });
  });

  test("dispatchNotification() success path creates SENT notification and sets warning.dispatchStatus = SENT", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("SUCCESS");
    setGatewayClient(mockGateway);

    const notif = await dispatchNotification(dummyWarning, "BOTH");

    expect(notif).toBeDefined();
    expect(notif.status).toBe("SENT");
    expect(notif.sentAt).toBeInstanceOf(Date);
    expect(notif.errorLog).toBeNull();
    expect(mockWarningsStore[0].dispatchStatus).toBe("SENT");
  });

  test("dispatchNotification() when gateway throws GatewayUnavailableError -> sets PENDING_DISPATCH", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    setGatewayClient(mockGateway);

    const notif = await dispatchNotification(dummyWarning, "SMS");

    expect(notif.status).toBe("PENDING_DISPATCH");
    expect(notif.errorLog).toContain("[UNAVAILABLE]");
    expect(mockWarningsStore[0].dispatchStatus).toBe("PENDING_DISPATCH");
  });

  test("dispatchNotification() when gateway throws GatewayCriticalError -> sets FAILED and populates errorLog", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("CRITICAL_ERROR");
    setGatewayClient(mockGateway);

    const notif = await dispatchNotification(dummyWarning, "PUSH");

    expect(notif.status).toBe("FAILED");
    expect(notif.errorLog).toContain("[CRITICAL_FAILURE]");
    expect(mockWarningsStore[0].dispatchStatus).toBe("FAILED");
  });

  test("retryNotificationDispatch() re-attempts pending/failed dispatch and succeeds", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("UNAVAILABLE");
    setGatewayClient(mockGateway);

    await dispatchNotification(dummyWarning);
    expect(mockWarningsStore[0].dispatchStatus).toBe("PENDING_DISPATCH");

    // Switch gateway to SUCCESS and retry
    mockGateway.setMode("SUCCESS");
    const retriedNotif = await retryNotificationDispatch(dummyWarning.warningId);

    expect(retriedNotif?.status).toBe("SENT");
    expect(mockWarningsStore[0].dispatchStatus).toBe("SENT");
  });

  test("retryNotificationDispatch() on an already-SENT warning is idempotent (no-op)", async () => {
    const mockGateway = new MockEmergencyGatewayClient();
    mockGateway.setMode("SUCCESS");
    setGatewayClient(mockGateway);

    mockWarningsStore[0].dispatchStatus = "SENT";
    mockNotificationsStore.push({
      notificationId: "notif-1",
      warningId: dummyWarning._id,
      status: "SENT",
      sentAt: new Date(),
    });

    const spySend = jest.spyOn(mockGateway, "send");
    const retriedNotif = await retryNotificationDispatch(dummyWarning.warningId);

    expect(retriedNotif?.status).toBe("SENT");
    expect(spySend).not.toHaveBeenCalled();
  });
});
