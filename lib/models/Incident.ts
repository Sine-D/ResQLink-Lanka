import mongoose, { Schema, Document, Model } from "mongoose";

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";
export type IncidentStatus = "OPEN" | "DISPATCHED" | "RESOLVED";

export interface IIncident extends Document {
  _id: mongoose.Types.ObjectId;
  incidentId: string;
  title: string;
  district: string;
  locationName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  trappedCount: number;
  description: string;
  reportedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    district: { type: String, required: true },
    locationName: { type: String, required: true },
    severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], required: true },
    status: { type: String, enum: ["OPEN", "DISPATCHED", "RESOLVED"], default: "OPEN" },
    trappedCount: { type: Number, default: 1 },
    description: { type: String, required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Incident: Model<IIncident> =
  mongoose.models.Incident || mongoose.model<IIncident>("Incident", IncidentSchema);

export default Incident;
