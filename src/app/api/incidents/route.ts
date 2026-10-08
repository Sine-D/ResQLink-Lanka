import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Incident from "@/lib/models/Incident";
import RescueTeam from "@/lib/models/RescueTeam";
import User from "@/lib/models/User";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectMongo();

    let incidents = await Incident.find({ status: { $in: ["OPEN", "DISPATCHED"] } }).sort({ createdAt: -1 });
    let teams = await RescueTeam.find({});

    // Seed dummy data if none exist
    const totalIncidents = await Incident.countDocuments();
    if (totalIncidents === 0) {
      // Find a user to act as reportedBy
      let user = await User.findOne({ role: "DMC_OFFICER" });
      if (!user) {
        user = await User.findOne(); // Any user
      }
      
      const reportedBy = user ? user._id : new mongoose.Types.ObjectId();

      await Incident.create([
        {
          incidentId: "INC-101",
          title: "Trapped Citizens at Kelani Bank",
          district: "Colombo",
          locationName: "Kelani Bank, Wellampitiya",
          severity: "Critical",
          status: "OPEN",
          trappedCount: 15,
          description: "Water level rising rapidly. People stuck on the second floor.",
          reportedBy: reportedBy,
        },
        {
          incidentId: "INC-102",
          title: "House Collapse due to Landslide",
          district: "Ratnapura",
          locationName: "Pelmadulla",
          severity: "High",
          status: "OPEN",
          trappedCount: 4,
          description: "Part of the hill collapsed on a house. Need immediate evacuation.",
          reportedBy: reportedBy,
        }
      ]);
      incidents = await Incident.find({ status: { $in: ["OPEN", "DISPATCHED"] } }).sort({ createdAt: -1 });
    }

    const totalTeams = await RescueTeam.countDocuments();
    if (totalTeams === 0) {
      await RescueTeam.create([
        {
          teamId: "TEAM-COLOMBO-1",
          name: "Navy Special Boat Squadron",
          district: "Colombo",
          leadOfficer: "Cmdr. Perera",
          memberCount: 4,
          isAvailable: true,
          contactNo: "0771234567"
        },
        {
          teamId: "TEAM-RATNAPURA-1",
          name: "Army Rescue Unit Alpha",
          district: "Ratnapura",
          leadOfficer: "Capt. Silva",
          memberCount: 6,
          isAvailable: true,
          contactNo: "0777654321"
        }
      ]);
      teams = await RescueTeam.find({});
    }

    const districts = [
      "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", 
      "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", 
      "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", 
      "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ].sort();

    const incidentTitles = [
      "Flood",
      "Tsunami",
      "Landslide"
    ].sort();

    return NextResponse.json({ incidents, teams, districts, incidentTitles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incidents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    
    // Generate incident ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const incidentId = `INC-${new Date().getFullYear()}-${randomSuffix}`;
    
    // Fallback reportedBy if not provided
    let reportedBy = body.reportedBy;
    if (!reportedBy) {
      let user = await User.findOne({ role: "DISTRICT_OFFICER" });
      if (!user) user = await User.findOne();
      reportedBy = user ? user._id : new mongoose.Types.ObjectId();
    }
    
    const newIncident = new Incident({
      incidentId,
      title: body.title,
      district: body.district,
      locationName: body.locationName,
      severity: body.severity,
      status: body.status || "OPEN",
      trappedCount: body.trappedCount || 0,
      description: body.description,
      reportedBy
    });
    
    const savedIncident = await newIncident.save();
    return NextResponse.json(savedIncident, { status: 201 });
  } catch (err: unknown) {
    console.error("Error creating incident:", err);
    const message = err instanceof Error ? err.message : "Failed to create incident";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
