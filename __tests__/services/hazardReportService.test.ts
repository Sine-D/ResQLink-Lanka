import HazardReport from "../../lib/models/HazardReport";
import {
  getAllHazardReports,
  getHazardReportById,
  rejectHazardReport,
  verifyHazardReport,
} from "../../lib/services/hazardReportService";

jest.mock("../../lib/models/HazardReport");

describe("Hazard Report Service (Member 2)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("lists reports newest first", async () => {
    const reports = [{ reportId: "report-1" }];
    const sort = jest.fn().mockResolvedValue(reports);
    (HazardReport.find as jest.Mock).mockReturnValue({ sort });

    await expect(getAllHazardReports()).resolves.toEqual(reports);
    expect(HazardReport.find).toHaveBeenCalledWith({});
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  test("returns an empty list when no hazard reports exist", async () => {
    const sort = jest.fn().mockResolvedValue([]);
    (HazardReport.find as jest.Mock).mockReturnValue({ sort });

    await expect(getAllHazardReports()).resolves.toEqual([]);
    expect(sort).toHaveBeenCalledTimes(1);
  });

  test("propagates database errors while listing reports", async () => {
    const databaseError = new Error("Database unavailable");
    const sort = jest.fn().mockRejectedValue(databaseError);
    (HazardReport.find as jest.Mock).mockReturnValue({ sort });

    await expect(getAllHazardReports()).rejects.toThrow("Database unavailable");
  });

  test("finds a report by its public report ID", async () => {
    const report = { reportId: "report-2" };
    (HazardReport.findOne as jest.Mock).mockResolvedValue(report);

    await expect(getHazardReportById("report-2")).resolves.toEqual(report);
    expect(HazardReport.findOne).toHaveBeenCalledWith({ reportId: "report-2" });
  });

  test("returns null when a report ID does not exist", async () => {
    (HazardReport.findOne as jest.Mock).mockResolvedValue(null);

    await expect(getHazardReportById("missing-report")).resolves.toBeNull();
    expect(HazardReport.findOne).toHaveBeenCalledWith({ reportId: "missing-report" });
  });

  test("propagates database errors while retrieving a report", async () => {
    (HazardReport.findOne as jest.Mock).mockRejectedValue(new Error("Lookup failed"));

    await expect(getHazardReportById("report-error")).rejects.toThrow("Lookup failed");
  });

  test("verifies only a pending report and records officer audit details", async () => {
    const updated = { reportId: "report-3", status: "VERIFIED" };
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

    await expect(verifyHazardReport("report-3", "officer-1", "Evidence confirmed")).resolves.toEqual(updated);
    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      { reportId: "report-3", status: "PENDING_VERIFICATION" },
      expect.objectContaining({
        status: "VERIFIED",
        verifiedBy: "officer-1",
        verificationNotes: "Evidence confirmed",
        reviewedAt: expect.any(Date),
      }),
      { new: true }
    );
  });

  test("rejects only a pending report and stores the reason and officer", async () => {
    const updated = { reportId: "report-4", status: "REJECTED" };
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

    await expect(rejectHazardReport("report-4", "officer-2", "Photo does not match the location")).resolves.toEqual(updated);
    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      { reportId: "report-4", status: "PENDING_VERIFICATION" },
      expect.objectContaining({
        status: "REJECTED",
        verifiedBy: "officer-2",
        verificationNotes: "Photo does not match the location",
        reviewedAt: expect.any(Date),
      }),
      { new: true }
    );
  });

  test("uses the default verification note when the officer does not provide one", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue({ status: "VERIFIED" });

    await verifyHazardReport("report-5", "officer-3");

    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ verificationNotes: "Verified by DMC Officer" }),
      { new: true }
    );
  });

  test("trims a verification note before storing it", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue({ status: "VERIFIED" });

    await verifyHazardReport("report-6", "officer-4", "  Location and photo confirmed  ");

    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ verificationNotes: "Location and photo confirmed" }),
      { new: true }
    );
  });

  test("uses the default verification note when only whitespace is provided", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue({ status: "VERIFIED" });

    await verifyHazardReport("report-7", "officer-5", "   ");

    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ verificationNotes: "Verified by DMC Officer" }),
      { new: true }
    );
  });

  test("returns null when verification targets a missing or already-reviewed report", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    await expect(verifyHazardReport("already-reviewed", "officer-6")).resolves.toBeNull();
    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      { reportId: "already-reviewed", status: "PENDING_VERIFICATION" },
      expect.any(Object),
      { new: true }
    );
  });

  test("propagates database errors during verification", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockRejectedValue(new Error("Verification update failed"));

    await expect(verifyHazardReport("report-8", "officer-7")).rejects.toThrow("Verification update failed");
  });

  test("trims the rejection reason before storing it", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue({ status: "REJECTED" });

    await rejectHazardReport("report-9", "officer-8", "  Duplicate report  ");

    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ verificationNotes: "Duplicate report" }),
      { new: true }
    );
  });

  test("returns null when rejection targets a missing or already-reviewed report", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    await expect(rejectHazardReport("missing-report", "officer-9", "Unable to verify")).resolves.toBeNull();
    expect(HazardReport.findOneAndUpdate).toHaveBeenCalledWith(
      { reportId: "missing-report", status: "PENDING_VERIFICATION" },
      expect.any(Object),
      { new: true }
    );
  });

  test("propagates database errors during rejection", async () => {
    (HazardReport.findOneAndUpdate as jest.Mock).mockRejectedValue(new Error("Rejection update failed"));

    await expect(rejectHazardReport("report-10", "officer-10", "Invalid evidence")).rejects.toThrow(
      "Rejection update failed"
    );
  });
});
