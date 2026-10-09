import Warning from "../../lib/models/Warning";
import NotificationModel from "../../lib/models/Notification";
import {
  dispatchNotification,
  retryNotificationDispatch,
  setGatewayClient,
  getGatewayClient,
  MockEmergencyGatewayClient,
  GatewayUnavailableError,
  GatewayCriticalError,
} from "../../lib/services/notificationService";

// Mock Mongoose models for offline-resilient unit testing
jest.mock("../../lib/models/Notification");
jest.mock("../../lib/models/Warning");

describe("UC1: Notification Service & Gateway Dispatch Unit Tests", () => {
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
          const index = mockNotificationsStore.findIndex(
            (n) => n.notificationId === this.notificationId
          );
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
      const found = mockWarningsStore.find(
        (w) => w.warningId === query.warningId || w._id === query._id
      );
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


  // 1. POSITIVE TEST CASES

  describe("1. Positive (Happy Path) Test Cases", () => {
    test("1.1 dispatchNotification() success path creates SENT notification and updates warning to SENT", async () => {
      const mockGateway = new MockEmergencyGatewayClient();
      mockGateway.setMode("SUCCESS");
      setGatewayClient(mockGateway);

      const notif = await dispatchNotification(dummyWarning, "BOTH");

      expect(notif).toBeDefined();
      expect(notif.status).toBe("SENT");
      expect(notif.channel).toBe("BOTH");
      expect(notif.sentAt).toBeInstanceOf(Date);
      expect(notif.errorLog).toBeNull();
      expect(notif.retryCount).toBe(0);
      expect(mockWarningsStore[0].dispatchStatus).toBe("SENT");
    });

    test("1.2 Supports individual channels SMS and PUSH correctly", async () => {
      const mockGateway = new MockEmergencyGatewayClient();
      mockGateway.setMode("SUCCESS");
      setGatewayClient(mockGateway);

      // SMS channel
      const smsNotif = await dispatchNotification(dummyWarning, "SMS");
      expect(smsNotif.channel).toBe("SMS");
      expect(smsNotif.status).toBe("SENT");

      // PUSH channel
      mockNotificationsStore = [];
      const pushNotif = await dispatchNotification(dummyWarning, "PUSH");
      expect(pushNotif.channel).toBe("PUSH");
      expect(pushNotif.status).toBe("SENT");
    });

    test("1.3 getGatewayClient() returns the currently configured gateway client instance", () => {
      const customGateway = new MockEmergencyGatewayClient();
      setGatewayClient(customGateway);

      const client = getGatewayClient();
      expect(client).toBe(customGateway);
    });

    test("1.4 MockEmergencyGatewayClient successfully creates dynamic message IDs with valid format", async () => {
      const gateway = new MockEmergencyGatewayClient();
      const res = await gateway.send({
        district: "Colombo",
        channel: "BOTH",
        message: "Test Emergency Message",
        targetReach: 750000,
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toMatch(/^GW-MSG-\d+-\d+$/);
    });
  });


  // 2. NEGATIVE & ERROR HANDLING TEST CASES

  describe("2. Negative & Error Handling Test Cases", () => {
    test("2.1 dispatchNotification() when gateway throws GatewayUnavailableError -> sets PENDING_DISPATCH", async () => {
      const mockGateway = new MockEmergencyGatewayClient();
      mockGateway.setMode("UNAVAILABLE");
      setGatewayClient(mockGateway);

      const notif = await dispatchNotification(dummyWarning, "SMS");

      expect(notif.status).toBe("PENDING_DISPATCH");
      expect(notif.errorLog).toContain("[UNAVAILABLE]");
      expect(notif.retryCount).toBe(1);
      expect(mockWarningsStore[0].dispatchStatus).toBe("PENDING_DISPATCH");
    });

    test("2.2 dispatchNotification() when gateway throws GatewayCriticalError -> sets FAILED and logs error", async () => {
      const mockGateway = new MockEmergencyGatewayClient();
      mockGateway.setMode("CRITICAL_ERROR");
      setGatewayClient(mockGateway);

      const notif = await dispatchNotification(dummyWarning, "PUSH");

      expect(notif.status).toBe("FAILED");
      expect(notif.errorLog).toContain("[CRITICAL_FAILURE]");
      expect(notif.retryCount).toBe(1);
      expect(mockWarningsStore[0].dispatchStatus).toBe("FAILED");
    });

    test("2.3 dispatchNotification() handles unexpected non-gateway generic errors safely", async () => {
      const brokenGateway = {
        send: jest.fn().mockRejectedValue(new Error("Unexpected DNS resolution timeout")),
      };
      setGatewayClient(brokenGateway as any);

      const notif = await dispatchNotification(dummyWarning, "BOTH");

      expect(notif.status).toBe("FAILED");
      expect(notif.errorLog).toContain("[CRITICAL_FAILURE] Unexpected DNS resolution timeout");
      expect(mockWarningsStore[0].dispatchStatus).toBe("FAILED");
    });

    test("2.4 Custom gateway error classes have correct names and default messages", () => {
      const unavailable = new GatewayUnavailableError();
      expect(unavailable.name).toBe("GatewayUnavailableError");
      expect(unavailable.message).toBe("Notification Gateway currently unavailable");

      const critical = new GatewayCriticalError();
      expect(critical.name).toBe("GatewayCriticalError");
      expect(critical.message).toBe("Critical transmission failure");
    });

    test("2.5 dispatchNotification() returns notification when gateway client returns success: false without throwing", async () => {
      const failingGateway = {
        send: jest.fn().mockResolvedValue({ success: false, messageId: "FAILED_ID" }),
      };
      setGatewayClient(failingGateway as any);

      const notif = await dispatchNotification(dummyWarning, "BOTH");
      expect(notif).toBeDefined();
    });

    test("2.6 E4 Fallback: when PUSH channel fails 3 retries, falls back to SMS channel and dispatches successfully", async () => {
      let callCount = 0;
      const gatewayWithPushFailure = {
        send: jest.fn().mockImplementation(({ channel }) => {
          callCount++;
          if (channel === "PUSH") {
            return Promise.resolve({ success: false, messageId: `PUSH_FAIL_${callCount}` });
          }
          // Fallback to SMS succeeds
          return Promise.resolve({ success: true, messageId: "SMS_FALLBACK_OK" });
        }),
      };
      setGatewayClient(gatewayWithPushFailure as any);

      const notif = await dispatchNotification(dummyWarning, "PUSH");
      expect(notif.channel).toBe("SMS");
      expect(notif.status).toBe("SENT");
      expect(notif.errorLog).toContain("[FALLBACK_E4]");
    });

    test("2.7 E5 Health Check: gateway isHealthy returning false throws GatewayUnavailableError and sets PENDING_DISPATCH", async () => {
      const gatewayWithHealth = {
        isHealthy: jest.fn().mockResolvedValue(false),
        send: jest.fn(),
      };
      setGatewayClient(gatewayWithHealth as any);

      const notif = await dispatchNotification(dummyWarning, "SMS");
      expect(notif.status).toBe("PENDING_DISPATCH");
      expect(notif.errorLog).toContain("Gateway health check failed");
      expect(mockWarningsStore[0].dispatchStatus).toBe("PENDING_DISPATCH");
    });

    test("2.8 E5 Health Check: gateway isHealthy throwing unexpected error sets PENDING_DISPATCH", async () => {
      const gatewayHealthThrow = {
        isHealthy: jest.fn().mockRejectedValue(new Error("Network probe failed")),
        send: jest.fn(),
      };
      setGatewayClient(gatewayHealthThrow as any);

      const notif = await dispatchNotification(dummyWarning, "SMS");
      expect(notif.status).toBe("PENDING_DISPATCH");
      expect(notif.errorLog).toContain("Network probe failed");
    });

    test("2.9 E5 Health Check: gateway isHealthy returning true executes health check and sends normally", async () => {
      const gatewayHealthy = {
        isHealthy: jest.fn().mockResolvedValue(true),
        send: jest.fn().mockResolvedValue({ success: true, messageId: "HEALTHY_GW_OK" }),
      };
      setGatewayClient(gatewayHealthy as any);

      const notif = await dispatchNotification(dummyWarning, "SMS");
      expect(notif.status).toBe("SENT");
      expect(gatewayHealthy.isHealthy).toHaveBeenCalled();
    });

    test("2.10 E5 Health Check: gateway isHealthy throwing non-Error string maps error message via String(healthErr)", async () => {
      const gatewayStringThrow = {
        isHealthy: jest.fn().mockRejectedValue("Raw string gateway timeout"),
        send: jest.fn(),
      };
      setGatewayClient(gatewayStringThrow as any);

      const notif = await dispatchNotification(dummyWarning, "SMS");
      expect(notif.status).toBe("PENDING_DISPATCH");
      expect(notif.errorLog).toContain("Raw string gateway timeout");
    });

    test("2.11 E4 Push Retry Success: succeeds on second attempt without falling back to SMS", async () => {
      let attempts = 0;
      const gatewayPushSuccessOnRetry = {
        send: jest.fn().mockImplementation(() => {
          attempts++;
          if (attempts === 1) {
            return Promise.resolve({ success: false, messageId: "ATTEMPT_1_FAIL" });
          }
          return Promise.resolve({ success: true, messageId: "ATTEMPT_2_SUCCESS" });
        }),
      };
      setGatewayClient(gatewayPushSuccessOnRetry as any);

      const notif = await dispatchNotification(dummyWarning, "PUSH");
      expect(notif.status).toBe("SENT");
      expect(notif.channel).toBe("PUSH");
      expect(notif.errorLog).toBeNull();
    });

    test("2.12 Non-Error Exception Handling: gateway throwing non-Error raw string during send maps to String(err)", async () => {
      const gatewayThrowsString = {
        send: jest.fn().mockRejectedValue("Fatal raw connection reset"),
      };
      setGatewayClient(gatewayThrowsString as any);

      const notif = await dispatchNotification(dummyWarning, "BOTH");
      expect(notif.status).toBe("FAILED");
      expect(notif.errorLog).toContain("Fatal raw connection reset");
    });
  });


  // 3. RETRY & IDEMPOTENCY TEST CASES

  describe("3. Retry & Idempotency Test Cases", () => {
    test("3.1 retryNotificationDispatch() re-attempts pending/failed dispatch and succeeds once gateway recovers", async () => {
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

    test("3.2 retryNotificationDispatch() on an already-SENT warning is idempotent (no re-send triggered)", async () => {
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
      spySend.mockRestore();
    });

    test("3.3 retryNotificationDispatch() throws descriptive error for non-existent warning ID", async () => {
      await expect(retryNotificationDispatch("non-existent-warning-id")).rejects.toThrow(
        "Warning with ID non-existent-warning-id not found"
      );
    });
  });
});
