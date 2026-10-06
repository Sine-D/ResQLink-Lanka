import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectMongo from "@/lib/db/connectMongo";
import RescueTeam from "@/lib/models/RescueTeam";

import RescueAssignment from "@/lib/models/RescueAssignment";
import Incident from "@/lib/models/Incident";

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const teams = await RescueTeam.find().sort({ createdAt: -1 }).lean();
    
    // Fetch active assignments for these teams
    const teamIds = teams.map(t => t._id);
    const activeAssignments = await RescueAssignment.find({
      teamId: { $in: teamIds },
      status: "ASSIGNED"
    }).populate('incidentId').lean();

    // Attach assigned incident to the team object
    const teamsWithAssignments = teams.map(team => {
      const assignment = activeAssignments.find(a => String(a.teamId) === String(team._id));
      return {
        ...team,
        assignedIncident: assignment ? assignment.incidentId : null
      };
    });

    return NextResponse.json(teamsWithAssignments);
  } catch (error) {
    console.error("Error fetching rescue teams:", error);
    return NextResponse.json({ error: "Failed to fetch rescue teams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectMongo();
    
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const teamId = `RT-${new Date().getFullYear()}-${randomNum}`;
    
    // Extract district from user input (location/district), then session, else default
    const district = body.location || body.district || (session.user as any)?.district || "Colombo District";
    
    const newTeam = new RescueTeam({
      teamId,
      name: body.name,
      leadOfficer: body.leadOfficer,
      contactNo: body.contactNumbers && body.contactNumbers.length > 0 ? body.contactNumbers[0] : "",
      contactNumbers: body.contactNumbers || [],
      expertise: body.expertise,
      equipmentList: body.equipmentList,
      district,
      location: body.location,
      memberCount: body.memberCount || 0,
      members: body.members || [],
      isAvailable: true,
    });
    
    const savedTeam = await newTeam.save();
    return NextResponse.json(savedTeam, { status: 201 });
  } catch (error) {
    console.error("Error creating rescue team:", error);
    return NextResponse.json({ error: "Failed to create rescue team" }, { status: 500 });
  }
}
