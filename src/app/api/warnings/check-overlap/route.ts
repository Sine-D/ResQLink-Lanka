import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { checkOverlappingActiveWarning } from "@/lib/services/warningService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district");
    const hazardType = searchParams.get("hazardType");
    const excludeId = searchParams.get("excludeId") || undefined;

    if (!district || !hazardType) {
      return NextResponse.json(
        { error: "Both district and hazardType parameters are required" },
        { status: 400 }
      );
    }

    await connectMongo();
    const existing = await checkOverlappingActiveWarning(district, hazardType, excludeId);

    if (existing) {
      return NextResponse.json({
        hasOverlap: true,
        existingWarning: {
          warningId: existing.warningId,
          hazardType: existing.hazardType,
          district: existing.targetArea.districtName,
          severity: existing.severity,
          validFrom: existing.validFrom,
          validUntil: existing.validUntil,
        },
      });
    }

    return NextResponse.json({ hasOverlap: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check overlapping warning";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
