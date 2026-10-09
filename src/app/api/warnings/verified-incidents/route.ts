import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import HazardReport from "@/lib/models/HazardReport";
import Incident from "@/lib/models/Incident";

const VALID_DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];

function normalizeHazardType(raw: string): string {
  const lower = (raw || "").toLowerCase();
  if (lower.includes("flash") || lower.includes("flashflood")) return "FlashFlood";
  if (lower.includes("flood") || lower.includes("water")) return "Flood";
  if (lower.includes("landslide") || lower.includes("collapse")) return "Landslide";
  if (lower.includes("cyclone") || lower.includes("wind") || lower.includes("storm")) return "Cyclone";
  if (lower.includes("tsunami")) return "Tsunami";
  if (lower.includes("drought")) return "Drought";
  return "Flood"; // default fallback for weather/disaster
}

function resolveDistrict(loc: string, fallback: string = "Colombo"): string {
  if (!loc) return fallback;
  const lower = loc.toLowerCase();
  for (const d of VALID_DISTRICTS) {
    if (lower.includes(d.toLowerCase())) return d;
  }
  return fallback;
}

export async function GET(req: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const rawDistrict = searchParams.get("district");
    const rawHazard = searchParams.get("hazardType");

    const filterDistrict = rawDistrict && rawDistrict !== "ALL"
      ? rawDistrict.replace(/[^a-zA-Z\s]/g, "").trim()
      : null;
    const filterHazard = rawHazard && rawHazard !== "ALL"
      ? rawHazard.replace(/[^a-zA-Z\s]/g, "").trim()
      : null;

    // 1. Fetch Verified Citizen Reports
    const hazardQuery: Record<string, any> = { status: "VERIFIED" };
    if (filterDistrict) {
      hazardQuery.$or = [
        { locationName: { $regex: filterDistrict, $options: "i" } },
        { description: { $regex: filterDistrict, $options: "i" } },
      ];
    }

    const verifiedReports = await HazardReport.find(hazardQuery)
      .sort({ reviewedAt: -1, createdAt: -1 })
      .limit(50)
      .lean();

    // 2. Fetch Open/Active Operational Incidents
    const incidentQuery: Record<string, any> = {
      status: { $in: ["OPEN", "DISPATCHED", "RESOLVED"] },
    };
    if (filterDistrict) {
      incidentQuery.$or = [
        { district: { $regex: filterDistrict, $options: "i" } },
        { locationName: { $regex: filterDistrict, $options: "i" } },
        { title: { $regex: filterDistrict, $options: "i" } },
      ];
    }

    const activeIncidents = await Incident.find(incidentQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedIncidents: any[] = [];

    // Format Operational Incidents
    for (const inc of activeIncidents as any[]) {
      const hazard = normalizeHazardType(inc.title + " " + inc.description);
      if (filterHazard && filterHazard !== "ALL" && hazard !== filterHazard) continue;

      const district = resolveDistrict(inc.district, inc.district || "Colombo");
      formattedIncidents.push({
        id: inc.incidentId || inc._id.toString(),
        code: inc.incidentId || "INC",
        type: "OPERATIONAL_INCIDENT",
        title: inc.title || "Emergency Incident",
        displayLabel: `[${inc.incidentId || "INC"}] ${inc.title} • ${district} (${inc.severity} Severity)`,
        hazardType: hazard,
        district,
        severity: inc.severity || "High",
        description: inc.description || "",
        instructions: `Emergency response directive for ${district}: ${inc.description || "Move to safe shelters immediately."} Follow DMC official instructions.`,
        date: inc.createdAt,
      });
    }

    // Format Verified Citizen Hazard Reports
    for (const r of verifiedReports as any[]) {
      const hazard = normalizeHazardType(r.hazardType + " " + r.description);
      if (filterHazard && filterHazard !== "ALL" && hazard !== filterHazard) continue;

      const district = resolveDistrict(r.locationName, "Colombo");
      formattedIncidents.push({
        id: r.reportId || r._id.toString(),
        code: (r.reportId || "REP").slice(0, 8),
        type: "HAZARD_REPORT",
        title: `${r.hazardType} in ${r.locationName || district}`,
        displayLabel: `[VERIFIED] ${r.hazardType} at ${r.locationName || district} • ${district}`,
        hazardType: hazard,
        district,
        severity: "High",
        description: r.description || "",
        instructions: `Precautionary safety directives: Evacuate danger zones near ${r.locationName || district}. Monitor DMC emergency broadcast alerts.`,
        date: r.reviewedAt || r.createdAt,
      });
    }

    return NextResponse.json({
      incidents: formattedIncidents,
      totalCount: formattedIncidents.length,
      filterDistrict: filterDistrict || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch verified incidents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
