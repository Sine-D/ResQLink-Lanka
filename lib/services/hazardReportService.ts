import HazardReport from "@/lib/models/HazardReport";

export async function getAllHazardReports() {
  return HazardReport.find({}).sort({ createdAt: -1 });
}

export async function getHazardReportById(reportId: string) {
  return HazardReport.findOne({ reportId });
}

export async function verifyHazardReport(reportId: string, officerId: string, notes?: string) {
  return HazardReport.findOneAndUpdate(
    { reportId, status: "PENDING_VERIFICATION" },
    {
      status: "VERIFIED",
      verifiedBy: officerId,
      verificationNotes: notes?.trim() || "Verified by DMC Officer",
      reviewedAt: new Date(),
    },
    { new: true }
  );
}

export async function rejectHazardReport(reportId: string, officerId: string, notes: string) {
  return HazardReport.findOneAndUpdate(
    { reportId, status: "PENDING_VERIFICATION" },
    {
      status: "REJECTED",
      verifiedBy: officerId,
      verificationNotes: notes.trim(),
      reviewedAt: new Date(),
    },
    { new: true }
  );
}
