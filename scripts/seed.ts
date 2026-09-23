import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../lib/models/User";
import Warning from "../lib/models/Warning";
import NotificationModel from "../lib/models/Notification";
import ReliefResource from "../lib/models/ReliefResource";
import RescueTeam from "../lib/models/RescueTeam";
import Incident from "../lib/models/Incident";
import { v4 as uuidv4 } from "uuid";

// Load environment variables from .env / .env.local
loadEnvConfig(process.cwd());

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes("[Enter")) {
  console.error("❌ ERROR: MONGODB_URI environment variable is missing in .env!");
  console.error("Please add MONGODB_URI=\"your-mongodb-connection-string\" to your .env file.");
  process.exit(1);
}

async function seed() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGODB_URI!);

  await User.deleteMany({});
  await Warning.deleteMany({});
  await NotificationModel.deleteMany({});
  await ReliefResource.deleteMany({});
  await RescueTeam.deleteMany({});
  await Incident.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Creating seed users...");
  const dmcUser = await User.create({
    name: "Officer Ruwan Silva",
    email: "dmc@resqlink.lk",
    passwordHash,
    role: "DMC_OFFICER",
    district: "Colombo",
    contactNo: "+94771234567",
  });

  const citizenUser = await User.create({
    name: "Nimal Perera",
    email: "citizen.colombo@resqlink.lk",
    passwordHash,
    role: "CITIZEN",
    district: "Colombo",
    contactNo: "+94719876543",
  });

  const districtOfficer = await User.create({
    name: "Officer Kamal Fernando",
    email: "officer.galle@resqlink.lk",
    passwordHash,
    role: "DISTRICT_OFFICER",
    district: "Galle",
    contactNo: "+94785554433",
  });

  const rescueTeamUser = await User.create({
    name: "Rescue Lead Wickramasinghe",
    email: "rescue@resqlink.lk",
    passwordHash,
    role: "RESCUE_TEAM",
    district: "Colombo",
    contactNo: "+94701112233",
  });

  console.log("Creating seed active warning...");
  const sampleWarning = await Warning.create({
    warningId: uuidv4(),
    hazardType: "Flood",
    severity: "High",
    status: "ACTIVE",
    targetArea: {
      districtName: "Colombo",
      coordinates: {
        type: "Polygon",
        coordinates: [
          [
            [79.84, 6.90],
            [79.88, 6.90],
            [79.88, 6.96],
            [79.84, 6.96],
            [79.84, 6.90],
          ],
        ],
      },
      estimatedReach: 750000,
    },
    instructions:
      "Evacuate low-lying river bank regions along Kelani River immediately. Seek shelter on higher ground or designated DMC safe locations.",
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 86400000 * 2),
    issuedBy: dmcUser._id,
    dispatchStatus: "SENT",
  });

  await NotificationModel.create({
    notificationId: uuidv4(),
    warningId: sampleWarning._id,
    channel: "BOTH",
    message: "[EMERGENCY WARNING - HIGH] Flood hazard reported in Colombo. Instructions: Evacuate low-lying river bank regions immediately.",
    status: "SENT",
    sentAt: new Date(),
    retryCount: 0,
  });

  console.log("Creating seed relief resources...");
  await ReliefResource.create({
    resourceId: "RES-FOOD-01",
    name: "Emergency Dry Rations Pack",
    category: "FOOD",
    district: "Colombo",
    quantity: 500,
    unit: "Packs",
    minimumThreshold: 100,
  });

  await ReliefResource.create({
    resourceId: "RES-WATER-01",
    name: "Clean Bottled Water (5L)",
    category: "WATER",
    district: "Colombo",
    quantity: 1200,
    unit: "Bottles",
    minimumThreshold: 200,
  });

  console.log("Creating seed rescue team...");
  await RescueTeam.create({
    teamId: "TEAM-COLOMBO-1",
    name: "Navy Special Boat Squadron #1",
    district: "Colombo",
    leadOfficer: "Commander Senanayake",
    memberCount: 6,
    isAvailable: true,
    contactNo: "+94779998877",
  });

  console.log("Creating seed incident...");
  await Incident.create({
    incidentId: "INC-101",
    title: "Trapped Citizens at Kelani Bank",
    district: "Colombo",
    locationName: "Main Street, Kolonnawa",
    severity: "Critical",
    status: "OPEN",
    trappedCount: 8,
    description: "8 citizens trapped on roof due to rapid 4ft flash flooding.",
    reportedBy: citizenUser._id,
  });

  console.log("✅ Seeding completed successfully!");
  console.log("Demo User Accounts:");
  console.log("  DMC Officer:      dmc@resqlink.lk / password123");
  console.log("  Citizen:          citizen.colombo@resqlink.lk / password123");
  console.log("  District Officer: officer.galle@resqlink.lk / password123");
  console.log("  Rescue Team:      rescue@resqlink.lk / password123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
