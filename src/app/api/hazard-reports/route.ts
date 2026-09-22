import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import HazardReport from "@/lib/models/HazardReport";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    await connectMongo();
    const reports = await HazardReport.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ reports });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch hazard reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectMongo();

    const report = await HazardReport.create({
      reportId: uuidv4(),
      reporterId: body.reporterId || "507f1f77bcf86cd799439011",
      hazardType: body.hazardType || "Flood",
      locationName: body.locationName || "Colombo Fort",
      coordinates: body.coordinates || { latitude: 6.9271, longitude: 79.8612 },
      description: body.description || "Rising water level near train station",
      photoUrl: body.photoUrl || "",
      status: "PENDING_VERIFICATION",
    });

    return NextResponse.json({ message: "Hazard report submitted", report }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit hazard report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
