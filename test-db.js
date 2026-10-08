const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf-8');
const mongoUriLine = envContent.split('\n').find(line => line.startsWith('MONGODB_URI='));
if (!mongoUriLine) {
  console.log('No MONGODB_URI found');
  process.exit(1);
}
const uri = mongoUriLine.substring('MONGODB_URI='.length).trim();

// Mock models
const Schema = mongoose.Schema;

const IncidentSchema = new Schema({
    incidentId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
});
const Incident = mongoose.model("Incident", IncidentSchema);

const RescueTeamSchema = new Schema({
    teamId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
});
const RescueTeam = mongoose.model("RescueTeam", RescueTeamSchema);

const RescueAssignmentSchema = new Schema({
    assignmentId: { type: String, required: true, unique: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "RescueTeam", required: true },
    status: { type: String }
});
const RescueAssignment = mongoose.model("RescueAssignment", RescueAssignmentSchema);

mongoose.connect(uri).then(async () => {
  try {
    const teams = await RescueTeam.find().sort({ createdAt: -1 }).lean();
    console.log("Teams fetched:", teams.length);
    
    const teamIds = teams.map(t => t._id);
    const activeAssignments = await RescueAssignment.find({
      teamId: { $in: teamIds },
      status: "ASSIGNED"
    }).populate('incidentId').lean();
    
    console.log("Active assignments:", activeAssignments.length);
    
    const teamsWithAssignments = teams.map(team => {
      const assignment = activeAssignments.find(a => String(a.teamId) === String(team._id));
      return {
        ...team,
        assignedIncident: assignment ? assignment.incidentId : null
      };
    });
    console.log("Success! Final teams:", teamsWithAssignments.length);
  } catch (error) {
    console.error("Error in logic:", error);
  }
  process.exit(0);
});
