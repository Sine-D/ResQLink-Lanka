import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import HazardReport from "@/lib/models/HazardReport";
import Incident from "@/lib/models/Incident";

export async function GET() {
  try {
    await connectMongo();

    // 1. Fetch Verified Hazard Reports from citizens
    const verifiedReports = await HazardReport.find({
      status: "VERIFIED",
    })
      .sort({ reviewedAt: -1, createdAt: -1 })
      .limit(20)
      .lean();

    // 2. Fetch Open/Active incidents from operations
    const activeIncidents = await Incident.find({
      status: { $in: ["OPEN", "DISPATCHED"] },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formattedIncidents = [
      ...verifiedReports.map((r: any) => ({
        id: r.reportId || r._id.toString(),
        type: "HAZARD_REPORT",
        title: `${r.hazardType} in ${r.locationName || "Area"} (Verified Report)`,
        hazardType: r.hazardType,
        district: r.locationName?.split(",")[0]?.trim() || "Colombo",
        severity: "High",
        description: r.description || "",
        instructions: `Precautionary safety instructions: Stay clear of ${r.hazardType} hazard zones around ${r.locationName || "the affected area"}. Follow DMC evacuation advisories.`,
        date: r.reviewedAt || r.createdAt,
      })),
      ...activeIncidents.map((inc: any) => ({
        id: inc.incidentId || inc._id.toString(),
        type: "OPERATIONAL_INCIDENT",
        title: `${inc.title} - ${inc.district} (${inc.severity} Severity)`,
        hazardType: inc.title.toLowerCase().includes("flood")
          ? "Flood"
          : inc.title.toLowerCase().includes("landslide")
          ? "Landslide"
          : inc.title.toLowerCase().includes("cyclone")
          ? "Cyclone"
          : "FlashFlood",
        district: inc.district || "Colombo",
        severity: inc.severity || "High",
        description: inc.description || "",
        instructions: `Emergency response advisory for ${inc.district}: ${inc.description}. Please move to safe shelters.`,
        date: inc.createdAt,
      })),
    ];

    return NextResponse.json({ incidents: formattedIncidents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch verified incidents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
