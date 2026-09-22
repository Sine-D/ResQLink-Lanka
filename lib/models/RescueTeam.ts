import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRescueTeam extends Document {
  _id: mongoose.Types.ObjectId;
  teamId: string;
  name: string;
  district: string;
  leadOfficer: string;
  memberCount: number;
  isAvailable: boolean;
  contactNo: string;
  createdAt: Date;
  updatedAt: Date;
}

const RescueTeamSchema = new Schema<IRescueTeam>(
  {
    teamId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    district: { type: String, required: true },
    leadOfficer: { type: String, required: true },
    memberCount: { type: Number, required: true, default: 4 },
    isAvailable: { type: Boolean, default: true },
    contactNo: { type: String, required: true },
  },
  { timestamps: true }
);

const RescueTeam: Model<IRescueTeam> =
  mongoose.models.RescueTeam || mongoose.model<IRescueTeam>("RescueTeam", RescueTeamSchema);

export default RescueTeam;
