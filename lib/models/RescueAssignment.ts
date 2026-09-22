import mongoose, { Schema, Document, Model } from "mongoose";

export type RescueAssignmentStatus = "ASSIGNED" | "EN_ROUTE" | "ON_SCENE" | "COMPLETED";

export interface IRescueAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  assignmentId: string;
  incidentId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  dispatchedBy: mongoose.Types.ObjectId;
  status: RescueAssignmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RescueAssignmentSchema = new Schema<IRescueAssignment>(
  {
    assignmentId: { type: String, required: true, unique: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "RescueTeam", required: true },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["ASSIGNED", "EN_ROUTE", "ON_SCENE", "COMPLETED"],
      default: "ASSIGNED",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const RescueAssignment: Model<IRescueAssignment> =
  mongoose.models.RescueAssignment ||
  mongoose.model<IRescueAssignment>("RescueAssignment", RescueAssignmentSchema);

export default RescueAssignment;
