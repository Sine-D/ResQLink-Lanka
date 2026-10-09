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
  validateTargetArea,
  estimateDistrictReach,
  InvalidTargetAreaError,
  WarningNotFoundError,
  InvalidWarningStateError,
  TargetArea,
  checkOverlappingActiveWarning,
  cancelWarning,
  getWarningDeliverySummary,
  OverlappingWarningError,
  deleteDraft,
  updateDraft,
  checkAndExpireWarning,
  checkAndExpireAllActiveWarnings,
} from "../../lib/services/warningService";
import * as notificationService from "../../lib/services/notificationService";
import { createWarningSchema, geoJSONPolygonSchema } from "../../lib/validation/warningSchema";
import { ZodError } from "zod";

jest.mock("../../lib/models/Warning");
jest.mock("../../lib/models/User");
jest.mock("../../lib/models/Notification");

describe("UC1: Disaster Warning & Alert Management Service Tests", () => {
  let mockWarningsStore: any[] = [];
  let mockNotificationsStore: any[] = [];
  const dummyUserId = "507f1f77bcf86cd799439011";

  // Standard valid GeoJSON Polygon for testing
  const validPolygon = {
    type: "Polygon" as const,
    coordinates: [
      [
        [79.86, 6.92] as [number, number],
        [79.88, 6.92] as [number, number],
        [79.88, 6.94] as [number, number],
        [79.86, 6.94] as [number, number],
        [79.86, 6.92] as [number, number],
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
            mockWarningsStore[idx] = { ...mockWarningsStore[idx], ...this };
          } else {
            mockWarningsStore.push({ ...this });
          }
          return Promise.resolve(this);
        }),
      };
      return instance;
    });

    (Warning.findOne as jest.Mock).mockImplementation((query: any) => {
      const found = mockWarningsStore.find((w) => {
        if (query.warningId && typeof query.warningId === "object" && query.warningId.$ne) {
          if (w.warningId === query.warningId.$ne) return false;
        } else if (query.warningId && typeof query.warningId === "string" && w.warningId !== query.warningId) {
          return false;
        }
        if (query._id && w._id?.toString() !== query._id?.toString() && w._id !== query._id) {
          return false;
        }
        if (query.status && w.status !== query.status) return false;
        if (query.hazardType && w.hazardType !== query.hazardType) return false;
        if (query["targetArea.districtName"]) {
          const regex = query["targetArea.districtName"];
          if (regex instanceof RegExp && !regex.test(w.targetArea.districtName)) return false;
        }
        return true;
      });
      if (!found) {
        return {
          populate: jest.fn().mockResolvedValue(null),
          then: (cb: any) => cb(null),
        };
      }
      const instance = {
        ...found,
        save: jest.fn().mockImplementation(function (this: any) {
          const idx = mockWarningsStore.findIndex((w) => w.warningId === this.warningId);
          if (idx >= 0) {
            mockWarningsStore[idx] = { ...mockWarningsStore[idx], ...this };
          }
          return Promise.resolve(this);
        }),
        populate: jest.fn().mockResolvedValue({
          ...found,
          issuedBy: {
            _id: dummyUserId,
            name: "Officer Perera",
            email: "perera@dmc.gov.lk",
            role: "DMC_OFFICER",
          },
        }),
      };
      return instance;
    });

    (Warning.findById as jest.Mock).mockImplementation((id: any) => {
      const found = mockWarningsStore.find(
        (w) => w._id?.toString() === id?.toString() || w._id === id
      );
      return Promise.resolve(found || null);
    });

    (Warning.findByIdAndUpdate as jest.Mock).mockImplementation((id: any, update: any) => {
      const target = mockWarningsStore.find(
        (w) => w._id?.toString() === id?.toString() || w._id === id
      );
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
          const idx = mockNotificationsStore.findIndex(
            (n) => n.notificationId === this.notificationId
          );
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

    (Warning.deleteOne as jest.Mock).mockImplementation((query: any) => {
      const idx = mockWarningsStore.findIndex((w) => w.warningId === query.warningId);
      if (idx >= 0) {
        mockWarningsStore.splice(idx, 1);
        return Promise.resolve({ deletedCount: 1 });
      }
      return Promise.resolve({ deletedCount: 0 });
    });

    (NotificationModel.deleteMany as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ deletedCount: 1 });
    });

    (Warning.updateMany as jest.Mock).mockImplementation((query: any, update: any) => {
      let count = 0;
      mockWarningsStore.forEach((w) => {
        let match = true;
        if (query.status && w.status !== query.status) match = false;
        if (query.validUntil?.$lte && new Date(w.validUntil) > query.validUntil.$lte) match = false;
        if (match) {
          if (update.$set) Object.assign(w, update.$set);
          count++;
        }
      });
      return Promise.resolve({ modifiedCount: count });
    });
  });


  // 1. POSITIVE TEST CASES

  describe("1. Positive (Happy Path) Test Cases", () => {
    test("1.1 createDraft() successfully creates a warning draft with DRAFT and NOT_SENT status", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);

      expect(draft).toBeDefined();
      expect(draft.warningId).toBeDefined();
      expect(typeof draft.warningId).toBe("string");
      expect(draft.hazardType).toBe("Flood");
      expect(draft.severity).toBe("High");
      expect(draft.status).toBe("DRAFT");
      expect(draft.dispatchStatus).toBe("NOT_SENT");
      expect(draft.targetArea.districtName).toBe("Colombo");
      expect(draft.targetArea.estimatedReach).toBe(750000); // Colombo population lookup
    });

    test("1.2 createDraft() decouples draft creation from broadcast: notificationService is NEVER called", async () => {
      const spyDispatch = jest.spyOn(notificationService, "dispatchNotification");

      await createDraft(sampleInput, dummyUserId);

      expect(spyDispatch).not.toHaveBeenCalled();
      spyDispatch.mockRestore();
    });

    test("1.3 issueWarning() transitions state DRAFT -> ACTIVE and persists before triggering dispatch", async () => {
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

    test("1.4 Query helpers: getWarningById(), listActiveWarnings(), and listAllWarnings() return populated models", async () => {
      const draft1 = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft1.warningId);

      const draft2 = await createDraft(
        { ...sampleInput, districtName: "Galle" },
        dummyUserId
      );

      // getWarningById
      const fetched = await getWarningById(draft1.warningId);
      expect(fetched).not.toBeNull();
      expect(fetched?.warningId).toBe(draft1.warningId);

      // listActiveWarnings without filters
      const activeWarnings = await listActiveWarnings();
      expect(activeWarnings.length).toBe(1);
      expect(activeWarnings[0].warningId).toBe(draft1.warningId);

      // listActiveWarnings with matching district
      const colomboActive = await listActiveWarnings("Colombo");
      expect(colomboActive.length).toBe(1);
      expect(colomboActive[0].targetArea.districtName).toBe("Colombo");

      // listActiveWarnings with non-matching district
      const galleActive = await listActiveWarnings("Galle");
      expect(galleActive.length).toBe(0);

      // listAllWarnings
      const allWarnings = await listAllWarnings();
      expect(allWarnings.length).toBe(2);
    });

    test("1.5 estimateDistrictReach() calculates correct demographic reach for major Sri Lankan districts", () => {
      expect(estimateDistrictReach("Colombo")).toBe(750000);
      expect(estimateDistrictReach("Gampaha")).toBe(600000);
      expect(estimateDistrictReach("Kandy")).toBe(400000);
      expect(estimateDistrictReach("Galle")).toBe(300000);
      expect(estimateDistrictReach("Kalutara")).toBe(350000);
      expect(estimateDistrictReach("Jaffna")).toBe(200000);
      expect(estimateDistrictReach("Badulla")).toBe(190000);
    });

    test("1.6 Supports all domain hazard types and severity levels correctly", async () => {
      const hazardTypes = [
        "Landslide",
        "Cyclone",
        "Tsunami",
        "Drought",
        "FlashFlood",
      ] as const;
      const severityLevels = ["Low", "Medium", "High", "Critical"] as const;

      for (let i = 0; i < hazardTypes.length; i++) {
        const hazard = hazardTypes[i];
        const severity = severityLevels[i % severityLevels.length];

        const draft = await createDraft(
          {
            ...sampleInput,
            hazardType: hazard,
            severity: severity,
            districtName: "Kandy",
          },
          dummyUserId
        );

        expect(draft.hazardType).toBe(hazard);
        expect(draft.severity).toBe(severity);
        expect(draft.targetArea.estimatedReach).toBe(400000);
      }
    });
  });


  // 2. NEGATIVE TEST CASES

  describe("2. Negative & Validation Test Cases", () => {
    test("2.1 Zod schema strictly rejects inverted dates (validUntil <= validFrom)", () => {
      const invalidDateInput = {
        ...sampleInput,
        validFrom: new Date(2026, 5, 10, 12, 0, 0),
        validUntil: new Date(2026, 5, 10, 11, 0, 0),
      };

      expect(() => createWarningSchema.parse(invalidDateInput)).toThrow(ZodError);
      try {
        createWarningSchema.parse(invalidDateInput);
      } catch (err: any) {
        expect(err.issues[0].message).toContain("Valid Until date must be strictly after Valid From date");
      }
    });

    test("2.2 Zod schema rejects empty instructions or instructions with less than 10 characters", () => {
      const shortInstructionsInput = {
        ...sampleInput,
        instructions: "Evacuate", // 8 chars (< 10)
      };
      expect(() => createWarningSchema.parse(shortInstructionsInput)).toThrow(ZodError);

      const emptyInstructionsInput = {
        ...sampleInput,
        instructions: "",
      };
      expect(() => createWarningSchema.parse(emptyInstructionsInput)).toThrow(ZodError);
    });

    test("2.3 Zod schema rejects missing hazardType or unsupported hazard categories", () => {
      const missingHazardInput = {
        ...sampleInput,
        hazardType: undefined,
      };
      expect(() => createWarningSchema.parse(missingHazardInput)).toThrow(ZodError);

      const invalidHazardInput = {
        ...sampleInput,
        hazardType: "VolcanoEruption", // Not in enum
      };
      expect(() => createWarningSchema.parse(invalidHazardInput)).toThrow(ZodError);
    });

    test("2.4 Zod schema rejects missing or empty districtName", () => {
      const emptyDistrictInput = {
        ...sampleInput,
        districtName: "",
      };
      expect(() => createWarningSchema.parse(emptyDistrictInput)).toThrow(ZodError);
    });

    test("2.5 geoJSONPolygonSchema rejects polygons with unclosed coordinates or fewer than 4 points", () => {
      // Unclosed polygon (first point != last point)
      const unclosedPolygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [79.86, 6.92] as [number, number],
            [79.88, 6.92] as [number, number],
            [79.88, 6.94] as [number, number],
            [79.86, 6.94] as [number, number], // Doesn't close back to [79.86, 6.92]
          ],
        ],
      };
      expect(() => geoJSONPolygonSchema.parse(unclosedPolygon)).toThrow(ZodError);

      // Fewer than 4 points
      const tooFewPointsPolygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [79.86, 6.92] as [number, number],
            [79.88, 6.92] as [number, number],
            [79.86, 6.92] as [number, number],
          ],
        ],
      };
      expect(() => geoJSONPolygonSchema.parse(tooFewPointsPolygon)).toThrow(ZodError);

      // Empty outer ring (covers outerRing.length < 4 boundary)
      const emptyRingPolygon = {
        type: "Polygon" as const,
        coordinates: [[]],
      };
      expect(() => geoJSONPolygonSchema.parse(emptyRingPolygon)).toThrow(ZodError);
    });

    test("2.6 validateTargetArea() throws InvalidTargetAreaError for empty string or null coordinates", () => {
      expect(() => validateTargetArea("", validPolygon.coordinates)).toThrow(
        InvalidTargetAreaError
      );
      expect(() => validateTargetArea("   ", validPolygon.coordinates)).toThrow(
        InvalidTargetAreaError
      );
      expect(() => validateTargetArea("Colombo", [])).toThrow(
        InvalidTargetAreaError
      );
      expect(() => validateTargetArea("Colombo", [[]])).toThrow(
        InvalidTargetAreaError
      );
    });
  });


  // 3. EDGE & BOUNDARY TEST CASES

  describe("3. Edge & Boundary Test Cases", () => {
    test("3.1 Minimal closed polygon with exactly 4 coordinate vertices passes validation", () => {
      const minimalTriangleClosed = {
        type: "Polygon" as const,
        coordinates: [
          [
            [79.86, 6.92] as [number, number],
            [79.88, 6.92] as [number, number],
            [79.87, 6.95] as [number, number],
            [79.86, 6.92] as [number, number], // 4 vertices, closed
          ],
        ],
      };

      expect(() => geoJSONPolygonSchema.parse(minimalTriangleClosed)).not.toThrow();
      expect(validateTargetArea("Colombo", minimalTriangleClosed.coordinates)).toBe(true);
    });

    test("3.2 Instructions field boundary: exactly 10 characters passes, 9 characters fails", () => {
      const exactly10Input = {
        ...sampleInput,
        instructions: "1234567890", // Exactly 10 chars
      };
      expect(() => createWarningSchema.parse(exactly10Input)).not.toThrow();

      const exactly9Input = {
        ...sampleInput,
        instructions: "123456789", // 9 chars
      };
      expect(() => createWarningSchema.parse(exactly9Input)).toThrow(ZodError);
    });

    test("3.3 Date boundary: validUntil exactly equal to validFrom fails strict inequality check", () => {
      const exactSameDate = new Date(2026, 6, 15, 10, 0, 0);
      const equalDatesInput = {
        ...sampleInput,
        validFrom: exactSameDate,
        validUntil: exactSameDate,
      };

      expect(() => createWarningSchema.parse(equalDatesInput)).toThrow(ZodError);
    });

    test("3.4 estimateDistrictReach() is resilient to irregular casing and whitespace padding", () => {
      expect(estimateDistrictReach("   colombo   ")).toBe(750000);
      expect(estimateDistrictReach("kAnDy")).toBe(400000);
      expect(estimateDistrictReach("NuWaRaElIyA")).toBe(210000);
      expect(estimateDistrictReach("  Galle ")).toBe(300000);
    });

    test("3.5 estimateDistrictReach() returns default fallback (150,000) for unmapped/custom districts", () => {
      expect(estimateDistrictReach("UnknownOceanicRegion")).toBe(150000);
      expect(estimateDistrictReach("InternationalWaters")).toBe(150000);
    });

    test("3.6 listActiveWarnings('ALL') returns all active warnings without applying district regex", async () => {
      const draft1 = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft1.warningId);

      const allActive = await listActiveWarnings("ALL");
      expect(allActive.length).toBe(1);
    });

    test("3.7 getWarningById() returns null when query finds no matching warning record", async () => {
      const result = await getWarningById("non-existent-uuid-12345");
      expect(result).toBeNull();
    });
  });


  // 4. ERROR & EXCEPTION TEST CASES

  describe("4. Error & Exception Handling Test Cases", () => {
    test("4.1 issueWarning() throws WarningNotFoundError for non-existent UUID", async () => {
      await expect(issueWarning("invalid-uuid-9999")).rejects.toThrow(WarningNotFoundError);
    });

    test("4.2 retryWarningDispatch() throws WarningNotFoundError for non-existent UUID", async () => {
      await expect(retryWarningDispatch("missing-uuid-8888")).rejects.toThrow(WarningNotFoundError);
    });

    test("4.3 issueWarning() throws InvalidTargetAreaError for unsupported/invalid district name and stays in DRAFT", async () => {
      const draftId = "unsupported-draft-uuid";
      mockWarningsStore.push({
        _id: "obj_unsupported_1",
        warningId: draftId,
        hazardType: "Flood",
        severity: "High",
        status: "DRAFT",
        targetArea: {
          districtName: "Unsupported_District",
          coordinates: validPolygon,
          estimatedReach: 0,
        },
        instructions: "Testing unsupported district error exception flow",
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 86400000),
        issuedBy: dummyUserId,
        dispatchStatus: "NOT_SENT",
      });

      await expect(issueWarning(draftId)).rejects.toThrow(InvalidTargetAreaError);

      const stored = mockWarningsStore.find((w) => w.warningId === draftId);
      expect(stored?.status).toBe("DRAFT");
      expect(stored?.dispatchStatus).toBe("NOT_SENT");
    });

    test("4.4 Custom error classes instantiate with correct properties and error codes", () => {
      const defaultTargetAreaError = new InvalidTargetAreaError();
      expect(defaultTargetAreaError.name).toBe("InvalidTargetAreaError");
      expect(defaultTargetAreaError.code).toBe("NO_COVERAGE");
      expect(defaultTargetAreaError.message).toBe("Invalid or uncovered target area boundary");

      const targetAreaError = new InvalidTargetAreaError("Custom boundary error");
      expect(targetAreaError.name).toBe("InvalidTargetAreaError");
      expect(targetAreaError.code).toBe("NO_COVERAGE");
      expect(targetAreaError.message).toBe("Custom boundary error");

      const defaultNotFoundError = new WarningNotFoundError();
      expect(defaultNotFoundError.name).toBe("WarningNotFoundError");
      expect(defaultNotFoundError.code).toBe("WARNING_NOT_FOUND");
      expect(defaultNotFoundError.message).toBe("Warning record not found");

      const notFoundError = new WarningNotFoundError("Custom not found message");
      expect(notFoundError.name).toBe("WarningNotFoundError");
      expect(notFoundError.message).toBe("Custom not found message");

      const stateError = new InvalidWarningStateError();
      expect(stateError.name).toBe("InvalidWarningStateError");
      expect(stateError.message).toBe("Invalid warning status transition");

      const customStateError = new InvalidWarningStateError("Cannot transition from EXPIRED to ACTIVE");
      expect(customStateError.message).toBe("Cannot transition from EXPIRED to ACTIVE");
    });
  });


  // 5. IDEMPOTENCY & FAULT TOLERANCE TEST CASES

  describe("5. Idempotency & Fault Tolerance Test Cases", () => {
    test("5.1 issueWarning() on an already-ACTIVE warning is idempotent and avoids redundant re-dispatch", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const firstIssue = await issueWarning(draft.warningId);
      expect(firstIssue.status).toBe("ACTIVE");

      const spyDispatch = jest.spyOn(notificationService, "dispatchNotification");

      // Attempt to issue the warning a second time
      const secondIssue = await issueWarning(draft.warningId);

      expect(secondIssue.status).toBe("ACTIVE");
      expect(spyDispatch).not.toHaveBeenCalled(); // Preserves idempotency
      spyDispatch.mockRestore();
    });

    test("5.2 retryWarningDispatch() on an already-SENT warning is a no-op (idempotency)", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      const spyDispatch = jest.spyOn(notificationService, "retryNotificationDispatch");

      const result = await retryWarningDispatch(draft.warningId);

      expect(result.dispatchStatus).toBe("SENT");
      expect(spyDispatch).toHaveBeenCalledWith(draft.warningId);
      spyDispatch.mockRestore();
    });

    test("5.3 dispatch() when gateway throws 'UNAVAILABLE' sets PENDING_DISPATCH while warning remains ACTIVE", async () => {
      const mockGateway = new notificationService.MockEmergencyGatewayClient();
      mockGateway.setMode("UNAVAILABLE");
      notificationService.setGatewayClient(mockGateway);

      const draft = await createDraft(sampleInput, dummyUserId);
      const issued = await issueWarning(draft.warningId);

      expect(issued.status).toBe("ACTIVE");
      expect(issued.dispatchStatus).toBe("PENDING_DISPATCH");
    });

    test("5.4 dispatch() when gateway throws CRITICAL_ERROR sets FAILED and populates errorLog while warning remains ACTIVE", async () => {
      const mockGateway = new notificationService.MockEmergencyGatewayClient();
      mockGateway.setMode("CRITICAL_ERROR");
      notificationService.setGatewayClient(mockGateway);

      const draft = await createDraft(sampleInput, dummyUserId);
      const issued = await issueWarning(draft.warningId);

      expect(issued.status).toBe("ACTIVE");
      expect(issued.dispatchStatus).toBe("FAILED");

      const notificationRecord = mockNotificationsStore.find(
        (n) => n.warningId?.toString() === draft._id?.toString()
      );
      expect(notificationRecord?.status).toBe("FAILED");
      expect(notificationRecord?.errorLog).toContain("[CRITICAL_FAILURE]");
    });

    test("5.5 retryWarningDispatch() recovers PENDING_DISPATCH to SENT when gateway service is restored", async () => {
      const mockGateway = new notificationService.MockEmergencyGatewayClient();
      mockGateway.setMode("UNAVAILABLE");
      notificationService.setGatewayClient(mockGateway);

      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      // Gateway restored to SUCCESS
      mockGateway.setMode("SUCCESS");
      const retried = await retryWarningDispatch(draft.warningId);

      expect(retried.dispatchStatus).toBe("SENT");
    });
  });


  // 6. FORMAL USE-CASE FLOWS 

  describe("6. Formal Use-Case Flows (A1, A5, Step 6, Step 7, Step 13)", () => {
    test("6.1 Step 6: TargetArea.validateArea() provides direct alias for geospatial boundary validation", () => {
      expect(TargetArea.validateArea("Colombo", validPolygon.coordinates)).toBe(true);
      expect(() => TargetArea.validateArea("", validPolygon.coordinates)).toThrow(InvalidTargetAreaError);
    });

    test("6.2 Flow A1: createDraft() correctly links optional sourceIncidentId from verified reports", async () => {
      const draft = await createDraft(
        { ...sampleInput, sourceIncidentId: "INC-2026-FLOOD-001" },
        dummyUserId
      );

      expect(draft.sourceIncidentId).toBe("INC-2026-FLOOD-001");
    });

    test("6.3 Step 7 & Flow E3: checkOverlappingActiveWarning() identifies conflicting active warnings", async () => {
      // Initially, no overlapping active warning exists
      const initialCheck = await checkOverlappingActiveWarning("Colombo", "Flood");
      expect(initialCheck).toBeNull();

      // Issue an active flood warning for Colombo
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      // Now overlapping check should find the active warning
      const overlapFound = await checkOverlappingActiveWarning("Colombo", "Flood");
      expect(overlapFound).not.toBeNull();
      expect(overlapFound?.warningId).toBe(draft.warningId);

      // Exclude check for self
      const excludeSelf = await checkOverlappingActiveWarning("Colombo", "Flood", draft.warningId);
      expect(excludeSelf).toBeNull();
    });

    test("6.4 Flow A5: cancelWarning() transitions ACTIVE -> CANCELLED and dispatches cancellation broadcast", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      const spyDispatch = jest.spyOn(notificationService, "dispatchNotification");

      const cancelled = await cancelWarning(draft.warningId);

      expect(cancelled.status).toBe("CANCELLED");
      expect(spyDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ warningId: draft.warningId, status: "CANCELLED" }),
        "BOTH"
      );
      spyDispatch.mockRestore();
    });

    test("6.5 Flow A5 Error: cancelWarning() throws InvalidWarningStateError if warning is not ACTIVE", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      // draft status is DRAFT, not ACTIVE
      await expect(cancelWarning(draft.warningId)).rejects.toThrow(InvalidWarningStateError);
    });

    test("6.6 Flow A5 Error: cancelWarning() throws WarningNotFoundError if warning does not exist", async () => {
      await expect(cancelWarning("non-existent-uuid-cancel")).rejects.toThrow(WarningNotFoundError);
    });

    test("6.7 Step 13: getWarningDeliverySummary() returns delivery metrics breakdown for active/sent warning", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      const summary = await getWarningDeliverySummary(draft.warningId);

      expect(summary).toBeDefined();
      expect(summary.warningId).toBe(draft.warningId);
      expect(summary.totalTargetReach).toBe(750000);
      expect(summary.dispatchStatus).toBe("SENT");
      expect(summary.sentCount).toBe(750000);
      expect(summary.deliveredCount).toBeGreaterThan(0);
      expect(summary.failedCount).toBe(0);
      expect(summary.pendingCount).toBe(0);
    });

    test("6.8 Step 13 Error: getWarningDeliverySummary() throws WarningNotFoundError for invalid ID", async () => {
      await expect(getWarningDeliverySummary("invalid-delivery-id")).rejects.toThrow(WarningNotFoundError);
    });

    test("6.9 OverlappingWarningError instantiates with correct name, code, and existingWarningId", () => {
      const defaultErr = new OverlappingWarningError();
      expect(defaultErr.name).toBe("OverlappingWarningError");
      expect(defaultErr.code).toBe("OVERLAPPING_ACTIVE_WARNING");
      expect(defaultErr.message).toBe("An overlapping active warning already exists for this area and hazard");

      const customErr = new OverlappingWarningError("Overlap detected in Galle", "WARN-GALLE-001");
      expect(customErr.existingWarningId).toBe("WARN-GALLE-001");
      expect(customErr.message).toBe("Overlap detected in Galle");
    });

    test("6.10 deleteDraft() permanently deletes a DRAFT warning from the database (CRUD: Delete)", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      expect(mockWarningsStore.some((w) => w.warningId === draft.warningId)).toBe(true);

      const result = await deleteDraft(draft.warningId);
      expect(result).toBe(true);
      expect(mockWarningsStore.some((w) => w.warningId === draft.warningId)).toBe(false);
    });

    test("6.11 deleteDraft() rejects deleting an ACTIVE warning and throws InvalidWarningStateError", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      await expect(deleteDraft(draft.warningId)).rejects.toThrow(InvalidWarningStateError);
    });

    test("6.12 deleteDraft() throws WarningNotFoundError for non-existent warning ID", async () => {
      await expect(deleteDraft("non-existent-draft-id")).rejects.toThrow(WarningNotFoundError);
    });

    test("6.13 updateDraft() successfully updates hazardType, severity, instructions, and time window on DRAFT warning (Flow A3)", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const updated = await updateDraft(draft.warningId, {
        hazardType: "Landslide",
        severity: "Critical",
        instructions: "Immediate evacuation ordered for mountainous zones.",
        validFrom: new Date(2026, 7, 1),
        validUntil: new Date(2026, 7, 3),
      });

      expect(updated.hazardType).toBe("Landslide");
      expect(updated.severity).toBe("Critical");
      expect(updated.instructions).toBe("Immediate evacuation ordered for mountainous zones.");
      expect(new Date(updated.validFrom).getTime()).toBe(new Date(2026, 7, 1).getTime());
    });

    test("6.14 updateDraft() updates districtName and coordinates, re-validates boundary and re-calculates estimatedReach", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const kandyPolygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [80.60, 7.28] as [number, number],
            [80.65, 7.28] as [number, number],
            [80.65, 7.32] as [number, number],
            [80.60, 7.32] as [number, number],
            [80.60, 7.28] as [number, number],
          ],
        ],
      };

      const updated = await updateDraft(draft.warningId, {
        districtName: "Kandy",
        coordinates: kandyPolygon,
      });

      expect(updated.targetArea.districtName).toBe("Kandy");
      expect(updated.targetArea.estimatedReach).toBe(400000); // Kandy density lookup
    });

    test("6.15 updateDraft() updates sourceIncidentId linkage on draft warning", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const updated = await updateDraft(draft.warningId, {
        sourceIncidentId: "INC-2026-9999",
      });

      expect(updated.sourceIncidentId).toBe("INC-2026-9999");
    });

    test("6.16 updateDraft() throws InvalidWarningStateError when attempting to edit an ACTIVE warning", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      await expect(
        updateDraft(draft.warningId, { instructions: "New instructions after active" })
      ).rejects.toThrow(InvalidWarningStateError);
    });

    test("6.17 updateDraft() throws WarningNotFoundError for non-existent warning ID", async () => {
      await expect(
        updateDraft("non-existent-draft-update", { instructions: "New instructions" })
      ).rejects.toThrow(WarningNotFoundError);
    });

    test("6.18 checkAndExpireWarning() transitions an ACTIVE warning to EXPIRED when validUntil has passed", async () => {
      const draft = await createDraft(
        {
          ...sampleInput,
          validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24), // -24 hours ago
          validUntil: new Date(Date.now() - 1000 * 60), // -1 minute ago
        },
        dummyUserId
      );
      await issueWarning(draft.warningId);

      const expired = await checkAndExpireWarning(draft.warningId);
      expect(expired).not.toBeNull();
      expect(expired?.status).toBe("EXPIRED");
    });

    test("6.19 checkAndExpireWarning() retains ACTIVE status when validUntil is in the future", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      const current = await checkAndExpireWarning(draft.warningId);
      expect(current?.status).toBe("ACTIVE");
    });

    test("6.20 checkAndExpireWarning() returns null for non-existent warning ID", async () => {
      const result = await checkAndExpireWarning("non-existent-expire-id");
      expect(result).toBeNull();
    });

    test("6.21 checkAndExpireAllActiveWarnings() batch updates multiple past-due active warnings to EXPIRED", async () => {
      const draft1 = await createDraft(
        {
          ...sampleInput,
          validFrom: new Date(Date.now() - 1000 * 60 * 60 * 48), // -48 hours ago
          validUntil: new Date(Date.now() - 1000 * 60),
        },
        dummyUserId
      );
      const draft2 = await createDraft(
        {
          ...sampleInput,
          validFrom: new Date(Date.now() - 1000 * 60 * 60 * 48), // -48 hours ago
          validUntil: new Date(Date.now() - 1000 * 120),
        },
        dummyUserId
      );
      await issueWarning(draft1.warningId);
      await issueWarning(draft2.warningId);

      const count = await checkAndExpireAllActiveWarnings();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  // 7. COMPREHENSIVE REGIONAL & DISASTER DOMAIN SCENARIOS
  describe("7. Comprehensive Regional & Disaster Domain Scenarios", () => {
    test("7.1 Multi-district overlapping active warning check isolates districts correctly", async () => {
      const colomboDraft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(colomboDraft.warningId);

      // Check overlap for Gampaha with same hazard: should NOT overlap
      const gampahaOverlap = await checkOverlappingActiveWarning("Gampaha", "Flood");
      expect(gampahaOverlap).toBeNull();

      // Check overlap for Colombo with same hazard: SHOULD overlap
      const colomboOverlap = await checkOverlappingActiveWarning("Colombo", "Flood");
      expect(colomboOverlap).not.toBeNull();
      expect(colomboOverlap?.warningId).toBe(colomboDraft.warningId);
    });

    test("7.2 listActiveWarnings() returns empty array when no active warnings match the specified district", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      const jaffnaWarnings = await listActiveWarnings("Jaffna");
      expect(jaffnaWarnings).toEqual([]);
    });

    test("7.3 Supports all 6 domain hazard types across provincial centers", async () => {
      const hazards = ["Flood", "Landslide", "Cyclone", "Tsunami", "Drought", "FlashFlood"] as const;
      for (const hazard of hazards) {
        const draft = await createDraft({ ...sampleInput, hazardType: hazard }, dummyUserId);
        expect(draft.hazardType).toBe(hazard);
      }
    });

    test("7.4 getWarningById() successfully populates issuedBy officer credentials", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const populated = await getWarningById(draft.warningId);

      expect(populated).not.toBeNull();
      expect(populated?.issuedBy).toBeDefined();
      expect((populated?.issuedBy as any).name).toBe("Officer Perera");
      expect((populated?.issuedBy as any).role).toBe("DMC_OFFICER");
    });

    test("7.5 retryWarningDispatch() handles recovered gateways and persists SENT dispatch status", async () => {
      const mockGateway = new notificationService.MockEmergencyGatewayClient();
      mockGateway.setMode("UNAVAILABLE"); // Fail initially
      notificationService.setGatewayClient(mockGateway);

      const draft = await createDraft(sampleInput, dummyUserId);
      const active = await issueWarning(draft.warningId);
      expect(active.dispatchStatus).toBe("PENDING_DISPATCH");

      // Recover gateway
      mockGateway.setMode("SUCCESS");
      const recovered = await retryWarningDispatch(draft.warningId);
      expect(recovered.dispatchStatus).toBe("SENT");
    });
  });

  // 8. UNCOVERED BRANCH & METRIC EDGE CASE COVERAGE
  describe("8. Uncovered Branch & Metric Edge Case Coverage", () => {
    test("8.1 getWarningDeliverySummary() handles FAILED and PENDING_DISPATCH dispatchStatus states", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      await issueWarning(draft.warningId);

      const storeIdx = mockWarningsStore.findIndex((w) => w.warningId === draft.warningId);

      // Mutate to FAILED
      mockWarningsStore[storeIdx].dispatchStatus = "FAILED";
      const failedSummary = await getWarningDeliverySummary(draft.warningId);
      expect(failedSummary.failedCount).toBe(mockWarningsStore[storeIdx].targetArea.estimatedReach);
      expect(failedSummary.sentCount).toBe(0);

      // Mutate to PENDING_DISPATCH
      mockWarningsStore[storeIdx].dispatchStatus = "PENDING_DISPATCH";
      const pendingSummary = await getWarningDeliverySummary(draft.warningId);
      expect(pendingSummary.pendingCount).toBe(mockWarningsStore[storeIdx].targetArea.estimatedReach);
      expect(pendingSummary.sentCount).toBe(0);

      // Mutate estimatedReach to 0
      mockWarningsStore[storeIdx].targetArea.estimatedReach = 0;
      mockWarningsStore[storeIdx].dispatchStatus = "SENT";
      const zeroReachSummary = await getWarningDeliverySummary(draft.warningId);
      expect(zeroReachSummary.totalTargetReach).toBe(0);
      expect(zeroReachSummary.sentCount).toBe(0);
    });

    test("8.2 getWarningDeliverySummary() handles missing notification record and zero estimated reach", async () => {
      const draft = await createDraft(
        { ...sampleInput, districtName: "UnknownDistrict" },
        dummyUserId
      );
      // Clear out any notification record
      mockNotificationsStore = [];

      const summary = await getWarningDeliverySummary(draft.warningId);
      expect(summary.channel).toBe("BOTH");
      expect(summary.retryCount).toBe(0);
      expect(summary.totalTargetReach).toBeGreaterThanOrEqual(0);
    });

    test("8.3 updateDraft() with partial updates: ONLY districtName without coordinates", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const updated = await updateDraft(draft.warningId, {
        districtName: "Galle",
      });
      expect(updated.targetArea.districtName).toBe("Galle");
      expect(updated.targetArea.estimatedReach).toBe(300000);
      expect(updated.targetArea.coordinates).toEqual(sampleInput.coordinates);
    });

    test("8.4 updateDraft() with partial updates: ONLY coordinates without districtName", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const newPolygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [79.85, 6.91] as [number, number],
            [79.89, 6.91] as [number, number],
            [79.89, 6.97] as [number, number],
            [79.85, 6.97] as [number, number],
            [79.85, 6.91] as [number, number],
          ],
        ],
      };
      const updated = await updateDraft(draft.warningId, {
        coordinates: newPolygon,
      });
      expect(updated.targetArea.districtName).toBe("Colombo");
      expect(updated.targetArea.coordinates).toEqual(newPolygon);
    });

    test("8.5 updateDraft() handles sourceIncidentId being set and being cleared", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const updatedWithId = await updateDraft(draft.warningId, {
        sourceIncidentId: "INC-REPLACE-123",
      });
      expect(updatedWithId.sourceIncidentId).toBe("INC-REPLACE-123");

      const clearedWithEmpty = await updateDraft(draft.warningId, {
        sourceIncidentId: "",
      });
      expect(clearedWithEmpty.sourceIncidentId).toBeUndefined();
    });

    test("8.6 checkAndExpireAllActiveWarnings() returns 0 when no active warnings are modified", async () => {
      (Warning.updateMany as jest.Mock).mockResolvedValueOnce({ modifiedCount: 0 });
      const count = await checkAndExpireAllActiveWarnings();
      expect(count).toBe(0);

      (Warning.updateMany as jest.Mock).mockResolvedValueOnce({});
      const countFallback = await checkAndExpireAllActiveWarnings();
      expect(countFallback).toBe(0);
    });

    test("8.7 Fallback to in-memory warning if findOne returns null during re-fetch in issue, cancel, and retry", async () => {
      const draft = await createDraft(sampleInput, dummyUserId);
      const originalImpl = (Warning.findOne as jest.Mock).getMockImplementation()!;

      // Issue fallback
      let issueLookups = 0;
      (Warning.findOne as jest.Mock).mockImplementation((query: any) => {
        if (query.warningId === draft.warningId) {
          issueLookups++;
          if (issueLookups === 2) {
            return Promise.resolve(null);
          }
        }
        return originalImpl(query);
      });
      const issued = await issueWarning(draft.warningId);
      expect(issued).toBeDefined();

      // Cancel fallback
      let cancelLookups = 0;
      (Warning.findOne as jest.Mock).mockImplementation((query: any) => {
        if (query.warningId === draft.warningId) {
          cancelLookups++;
          if (cancelLookups === 2) {
            return Promise.resolve(null);
          }
        }
        return originalImpl(query);
      });
      const cancelled = await cancelWarning(draft.warningId);
      expect(cancelled).toBeDefined();

      // Retry fallback
      const storeIdx = mockWarningsStore.findIndex((w) => w.warningId === draft.warningId);
      if (storeIdx >= 0) mockWarningsStore[storeIdx].status = "ACTIVE";

      let retryLookups = 0;
      (Warning.findOne as jest.Mock).mockImplementation((query: any) => {
        if (query.warningId === draft.warningId) {
          retryLookups++;
          if (retryLookups === 3) {
            return Promise.resolve(null);
          }
        }
        return originalImpl(query);
      });
      const retried = await retryWarningDispatch(draft.warningId);
      expect(retried).toBeDefined();

      (Warning.findOne as jest.Mock).mockImplementation(originalImpl);
    });
  });
});

