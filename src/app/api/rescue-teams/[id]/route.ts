import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectMongo from "@/lib/db/connectMongo";
import RescueTeam from "@/lib/models/RescueTeam";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    await connectMongo();

    const team = await RescueTeam.findById(id);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (body.status) {
      team.status = body.status;
      // Also update isAvailable for legacy compatibility
      team.isAvailable = body.status === 'Active';
    }

    const updatedTeam = await team.save();
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Error updating rescue team:", error);
    return NextResponse.json({ error: "Failed to update rescue team" }, { status: 500 });
  }
}
