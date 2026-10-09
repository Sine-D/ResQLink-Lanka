import { getServerSession } from "next-auth";
import { GET as getWarnings, POST as postWarnings } from "../../src/app/api/warnings/route";
import {
  GET as getWarningByIdRoute,
  PUT as putWarningByIdRoute,
  DELETE as deleteWarningDraftRoute,
} from "../../src/app/api/warnings/[id]/route";
import { POST as postIssueRoute } from "../../src/app/api/warnings/[id]/issue/route";
import { POST as postRetryDispatchRoute } from "../../src/app/api/warnings/[id]/retry-dispatch/route";
import { GET as getSummaryRoute } from "../../src/app/api/warnings/[id]/summary/route";
import { GET as getCheckOverlapRoute } from "../../src/app/api/warnings/check-overlap/route";
import { GET as getVerifiedIncidentsRoute } from "../../src/app/api/warnings/verified-incidents/route";

import * as warningService from "../../lib/services/warningService";
import HazardReport from "../../lib/models/HazardReport";
import Incident from "../../lib/models/Incident";
import { ZodError } from "zod";

// Mock external dependencies
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
  getServerSession: jest.fn(),
}));

jest.mock("../../lib/auth", () => ({
  authOptions: {},
}));

jest.mock("../../lib/db/connectMongo", () => jest.fn().mockResolvedValue(undefined));

jest.mock("../../lib/models/HazardReport");
jest.mock("../../lib/models/Incident");

describe("UC1: Warning REST API Controllers Test Suite", () => {
  const mockOfficerSession = {
    user: {
      id: "officer_user_01",
      name: "DMC Officer Test",
      email: "dmc@gov.lk",
      role: "DMC_OFFICER",
    },
  };

  const mockCitizenSession = {
    user: {
      id: "citizen_user_01",
      name: "Citizen Jane",
      email: "jane@gmail.com",
      role: "CITIZEN",
    },
  };

  const sampleWarning = {
    _id: "mongo_warn_123",
    warningId: "WARN-TEST-001",
    hazardType: "Flood",
    severity: "High",
    status: "DRAFT",
    targetArea: {
      districtName: "Colombo",
      estimatedReach: 750000,
    },
    instructions: "Evacuate river zones immediately.",
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    dispatchStatus: "NOT_SENT",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. GET /api/warnings
  // ==========================================================================
  describe("1. GET /api/warnings", () => {
    test("returns all warnings when mode is omitted or set to 'all'", async () => {
      const spy = jest
        .spyOn(warningService, "listAllWarnings")
        .mockResolvedValue([sampleWarning as any]);

      const req = new Request("http://localhost:3000/api/warnings");
      const res = await getWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.warnings).toHaveLength(1);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("returns active warnings when ?mode=active is provided", async () => {
      const spy = jest
        .spyOn(warningService, "listActiveWarnings")
        .mockResolvedValue([{ ...sampleWarning, status: "ACTIVE" } as any]);

      const req = new Request("http://localhost:3000/api/warnings?mode=active&district=Galle");
      const res = await getWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.warnings[0].status).toBe("ACTIVE");
      expect(spy).toHaveBeenCalledWith("Galle");
      spy.mockRestore();
    });

    test("handles database / internal errors with 500", async () => {
      const spy = jest
        .spyOn(warningService, "listAllWarnings")
        .mockRejectedValue(new Error("Database disconnected"));

      const req = new Request("http://localhost:3000/api/warnings");
      const res = await getWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Database disconnected");
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 2. POST /api/warnings
  // ==========================================================================
  describe("2. POST /api/warnings (Draft Creation)", () => {
    test("rejects unauthenticated requests with 401", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/warnings", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await postWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Authentication required");
    });

    test("rejects non-DMC Officers with 403 Forbidden", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockCitizenSession);

      const req = new Request("http://localhost:3000/api/warnings", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await postWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("Forbidden: Only DMC Officers");
    });

    test("creates draft successfully (201) when authorized as DMC Officer", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const spy = jest
        .spyOn(warningService, "createDraft")
        .mockResolvedValue(sampleWarning as any);

      const req = new Request("http://localhost:3000/api/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hazardType: "Flood",
          districtName: "Colombo",
        }),
      });

      const res = await postWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.warning.warningId).toBe("WARN-TEST-001");
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ hazardType: "Flood" }),
        "officer_user_01"
      );
      spy.mockRestore();
    });

    test("returns 422 for Zod validation errors", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const zodErr = new ZodError([
        {
          code: "too_small",
          minimum: 10,
          type: "string",
          inclusive: true,
          exact: false,
          message: "Instructions must be at least 10 characters long",
          path: ["instructions"],
        },
      ]);
      const spy = jest.spyOn(warningService, "createDraft").mockRejectedValue(zodErr);

      const req = new Request("http://localhost:3000/api/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: "short" }),
      });

      const res = await postWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(422);
      expect(data.error).toBe("VALIDATION_ERROR");
      spy.mockRestore();
    });

    test("returns 422 for InvalidTargetAreaError", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const targetAreaErr = new warningService.InvalidTargetAreaError(
        "Target area boundary polygon must be closed"
      );
      const spy = jest.spyOn(warningService, "createDraft").mockRejectedValue(targetAreaErr);

      const req = new Request("http://localhost:3000/api/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await postWarnings(req);
      const data = await res.json();

      expect(res.status).toBe(422);
      expect(data.error).toBe("NO_COVERAGE");
      expect(data.message).toBe("Target area boundary polygon must be closed");
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 3. GET /api/warnings/[id]
  // ==========================================================================
  describe("3. GET /api/warnings/[id]", () => {
    test("returns 200 with warning object when found", async () => {
      const spy = jest
        .spyOn(warningService, "getWarningById")
        .mockResolvedValue(sampleWarning as any);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001");
      const res = await getWarningByIdRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.warning.warningId).toBe("WARN-TEST-001");
      spy.mockRestore();
    });

    test("returns 404 when warning is not found", async () => {
      const spy = jest.spyOn(warningService, "getWarningById").mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/warnings/NON-EXISTENT");
      const res = await getWarningByIdRoute(req, {
        params: Promise.resolve({ id: "NON-EXISTENT" }),
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Warning record not found");
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 4. PUT /api/warnings/[id] (Draft Update)
  // ==========================================================================
  describe("4. PUT /api/warnings/[id] (Draft Update)", () => {
    test("rejects unauthenticated user with 401", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const res = await putWarningByIdRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });

      expect(res.status).toBe(401);
    });

    test("rejects non-DMC Officer with 403", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockCitizenSession);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const res = await putWarningByIdRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });

      expect(res.status).toBe(403);
    });

    test("successfully updates draft (200) for DMC Officer", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const updatedMock = { ...sampleWarning, instructions: "Updated instructions for safety" };
      const spy = jest
        .spyOn(warningService, "updateDraft")
        .mockResolvedValue(updatedMock as any);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: "Updated instructions for safety" }),
      });
      const res = await putWarningByIdRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.warning.instructions).toBe("Updated instructions for safety");
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 5. DELETE /api/warnings/[id] (Hard Delete / Discard Draft)
  // ==========================================================================
  describe("5. DELETE /api/warnings/[id] (Discard Draft)", () => {
    test("rejects unauthenticated user with 401", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001", {
        method: "DELETE",
      });
      const res = await deleteWarningDraftRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });

      expect(res.status).toBe(401);
    });

    test("rejects non-DMC user with 403", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockCitizenSession);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001", {
        method: "DELETE",
      });
      const res = await deleteWarningDraftRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });

      expect(res.status).toBe(403);
    });

    test("permanently deletes draft (200) when warning is in DRAFT state", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const spy = jest.spyOn(warningService, "deleteDraft").mockResolvedValue(undefined);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001", {
        method: "DELETE",
      });
      const res = await deleteWarningDraftRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(spy).toHaveBeenCalledWith("WARN-TEST-001");
      spy.mockRestore();
    });

    test("returns 400 when attempting to delete non-draft warning (InvalidWarningStateError)", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const stateErr = new warningService.InvalidWarningStateError(
        "Cannot discard warning: only warnings in DRAFT state can be deleted. Current status is ACTIVE."
      );
      const spy = jest.spyOn(warningService, "deleteDraft").mockRejectedValue(stateErr);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001", {
        method: "DELETE",
      });
      const res = await deleteWarningDraftRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("only warnings in DRAFT state can be deleted");
      spy.mockRestore();
    });

    test("returns 404 when warning not found (WarningNotFoundError)", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const notFoundErr = new warningService.WarningNotFoundError(
        "Warning with ID WARN-404 not found"
      );
      const spy = jest.spyOn(warningService, "deleteDraft").mockRejectedValue(notFoundErr);

      const req = new Request("http://localhost:3000/api/warnings/WARN-404", {
        method: "DELETE",
      });
      const res = await deleteWarningDraftRoute(req, {
        params: Promise.resolve({ id: "WARN-404" }),
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not found");
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 6. POST /api/warnings/[id]/issue
  // ==========================================================================
  describe("6. POST /api/warnings/[id]/issue (Issue & Broadcast)", () => {
    test("rejects unauthenticated user with 401", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001/issue", {
        method: "POST",
      });
      const res = await postIssueRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });

      expect(res.status).toBe(401);
    });

    test("rejects non-DMC user with 403", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockCitizenSession);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001/issue", {
        method: "POST",
      });
      const res = await postIssueRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });

      expect(res.status).toBe(403);
    });

    test("authorizes and issues warning (200)", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const issuedMock = { ...sampleWarning, status: "ACTIVE", dispatchStatus: "SENT" };
      const spy = jest
        .spyOn(warningService, "issueWarning")
        .mockResolvedValue(issuedMock as any);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001/issue", {
        method: "POST",
      });
      const res = await postIssueRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.warning.status).toBe("ACTIVE");
      expect(spy).toHaveBeenCalledWith("WARN-TEST-001");
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 7. POST /api/warnings/[id]/retry-dispatch
  // ==========================================================================
  describe("7. POST /api/warnings/[id]/retry-dispatch", () => {
    test("rejects unauthenticated user with 401", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001/retry-dispatch", {
        method: "POST",
      });
      const res = await postRetryDispatchRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });

      expect(res.status).toBe(401);
    });

    test("successfully retries dispatch (200)", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockOfficerSession);
      const updatedMock = { ...sampleWarning, dispatchStatus: "SENT" };
      const spy = jest
        .spyOn(warningService, "retryWarningDispatch")
        .mockResolvedValue(updatedMock as any);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001/retry-dispatch", {
        method: "POST",
      });
      const res = await postRetryDispatchRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe("Retry dispatch completed");
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 8. GET /api/warnings/[id]/summary
  // ==========================================================================
  describe("8. GET /api/warnings/[id]/summary", () => {
    test("returns warning and delivery summary metrics (200)", async () => {
      const summaryMock = {
        totalTargetReach: 750000,
        dispatchedChannels: ["BOTH"],
        smsSentCount: 750000,
        pushSentCount: 750000,
        dispatchStatus: "SENT",
        dispatchedAt: new Date(),
        retryCount: 0,
        errorLog: null,
      };

      const spyExpire = jest
        .spyOn(warningService, "checkAndExpireWarning")
        .mockResolvedValue(null as any);
      const spyGet = jest
        .spyOn(warningService, "getWarningById")
        .mockResolvedValue(sampleWarning as any);
      const spySummary = jest
        .spyOn(warningService, "getWarningDeliverySummary")
        .mockResolvedValue(summaryMock as any);

      const req = new Request("http://localhost:3000/api/warnings/WARN-TEST-001/summary");
      const res = await getSummaryRoute(req, {
        params: Promise.resolve({ id: "WARN-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary.totalTargetReach).toBe(750000);
      expect(spyExpire).toHaveBeenCalledWith("WARN-TEST-001");
      expect(spyGet).toHaveBeenCalledWith("WARN-TEST-001");
      expect(spySummary).toHaveBeenCalledWith("WARN-TEST-001");

      spyExpire.mockRestore();
      spyGet.mockRestore();
      spySummary.mockRestore();
    });
  });

  // ==========================================================================
  // 9. GET /api/warnings/check-overlap
  // ==========================================================================
  describe("9. GET /api/warnings/check-overlap", () => {
    test("returns 400 when district or hazardType query param is missing", async () => {
      const req = new Request("http://localhost:3000/api/warnings/check-overlap?district=Colombo");
      const res = await getCheckOverlapRoute(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Both district and hazardType parameters are required");
    });

    test("returns hasOverlap: true when overlapping warning exists", async () => {
      const spy = jest
        .spyOn(warningService, "checkOverlappingActiveWarning")
        .mockResolvedValue(sampleWarning as any);

      const req = new Request(
        "http://localhost:3000/api/warnings/check-overlap?district=Colombo&hazardType=Flood"
      );
      const res = await getCheckOverlapRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.hasOverlap).toBe(true);
      expect(data.existingWarning.warningId).toBe("WARN-TEST-001");
      spy.mockRestore();
    });

    test("returns hasOverlap: false when no conflict exists", async () => {
      const spy = jest
        .spyOn(warningService, "checkOverlappingActiveWarning")
        .mockResolvedValue(null);

      const req = new Request(
        "http://localhost:3000/api/warnings/check-overlap?district=Kandy&hazardType=Cyclone"
      );
      const res = await getCheckOverlapRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.hasOverlap).toBe(false);
      spy.mockRestore();
    });
  });

  // ==========================================================================
  // 10. GET /api/warnings/verified-incidents (Incident Link Integration)
  // ==========================================================================
  describe("10. GET /api/warnings/verified-incidents", () => {
    test("fetches and maps active incidents and verified citizen reports", async () => {
      const mockIncidents = [
        {
          incidentId: "INC-999",
          title: "Kelani River Overflowing",
          description: "Water levels rising above critical threshold",
          district: "Colombo",
          severity: "High",
          status: "OPEN",
          createdAt: new Date(),
        },
      ];

      const mockReports = [
        {
          reportId: "REP-88888888",
          hazardType: "FlashFlood",
          locationName: "Sedawatta, Colombo",
          description: "Rapid rise in flood water near bridge",
          status: "VERIFIED",
          createdAt: new Date(),
          reviewedAt: new Date(),
        },
      ];

      (Incident.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockIncidents),
          }),
        }),
      });

      (HazardReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReports),
          }),
        }),
      });

      const req = new Request(
        "http://localhost:3000/api/warnings/verified-incidents?district=Colombo&hazardType=Flood"
      );
      const res = await getVerifiedIncidentsRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.incidents.length).toBeGreaterThan(0);
      expect(data.incidents[0].district).toBe("Colombo");
    });
  });
});
