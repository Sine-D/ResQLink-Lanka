import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Incident from "@/lib/models/Incident";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await connectMongo();

    const incident = await Incident.findById(id);
    
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    if (body.title !== undefined) incident.title = body.title;
    if (body.district !== undefined) incident.district = body.district;
    if (body.locationName !== undefined) incident.locationName = body.locationName;
    if (body.severity !== undefined) incident.severity = body.severity;
    if (body.status !== undefined) incident.status = body.status;
    if (body.trappedCount !== undefined) incident.trappedCount = body.trappedCount;
    if (body.description !== undefined) incident.description = body.description;

    const updatedIncident = await incident.save();
    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectMongo();

    const result = await Incident.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      { error: "Failed to delete incident" },
      { status: 500 }
    );
  }
}
