import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Incident from "@/lib/models/Incident";
import RescueAssignment from "@/lib/models/RescueAssignment";
import RescueTeam from "@/lib/models/RescueTeam";
import { v4 as uuidv4 } from "uuid";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "DMC_OFFICER" && userRole !== "DISTRICT_OFFICER") {
      return NextResponse.json({ error: "Forbidden: Officer authorization required" }, { status: 403 });
    }

    const officerId = (session.user as { id: string }).id;
    const { id } = await params;
    const body = await req.json();
    await connectMongo();

    const incident = await Incident.findOne({ incidentId: id });
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
      teamId: team?._id,
      dispatchedBy: officerId,
      status: "ASSIGNED",
      notes: body.notes || "Emergency rescue team dispatched",
    });

    return NextResponse.json({ message: "Rescue team dispatched", assignment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Dispatch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
