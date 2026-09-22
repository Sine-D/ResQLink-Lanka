import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Incident from "@/lib/models/Incident";
import RescueAssignment from "@/lib/models/RescueAssignment";
import RescueTeam from "@/lib/models/RescueTeam";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    await connectMongo();

    const incident = await Incident.findOne({ incidentId: params.id });
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const team = await RescueTeam.findOne({ teamId: body.teamId });
    if (team) {
      team.isAvailable = false;
      await team.save();
    }

    incident.status = "DISPATCHED";
    await incident.save();

    const assignment = await RescueAssignment.create({
      assignmentId: uuidv4(),
      incidentId: incident._id,
      teamId: team?._id || "507f1f77bcf86cd799439011",
      dispatchedBy: body.officerId || "507f1f77bcf86cd799439011",
      status: "ASSIGNED",
      notes: body.notes || "Emergency rescue team dispatched",
    });

    return NextResponse.json({ message: "Rescue team dispatched", assignment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Dispatch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
