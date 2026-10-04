import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRescueTeam extends Document {
  _id: mongoose.Types.ObjectId;
  teamId: string;
  name: string;
  district: string;
  location?: string;
  leadOfficer: string;
  memberCount: number;
  members?: { name: string; contactNo: string }[];
  isAvailable: boolean;
  status: string;
  contactNo?: string;
  contactNumbers: string[];
  expertise?: string;
  equipmentList?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RescueTeamSchema = new Schema<IRescueTeam>(
  {
    teamId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    district: { type: String, required: true },
    location: { type: String },
    leadOfficer: { type: String, required: true },
    memberCount: { type: Number, required: true, default: 0 },
    members: [{
      name: { type: String },
      contactNo: { type: String }
    }],
    isAvailable: { type: Boolean, default: true },
    status: { type: String, enum: ['Active', 'Inactive', 'Standby'], default: 'Active' },
    contactNo: { type: String }, // Primary contact for legacy code
    contactNumbers: [{ type: String, required: true }],
    expertise: { type: String },
    equipmentList: { type: String },
  },
  { timestamps: true }
);

const RescueTeam: Model<IRescueTeam> =
  mongoose.models.RescueTeam || mongoose.model<IRescueTeam>("RescueTeam", RescueTeamSchema);

export default RescueTeam;
