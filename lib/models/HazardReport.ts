import mongoose, { Schema, Document, Model } from "mongoose";

export type HazardReportStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export interface IHazardReport extends Document {
  _id: mongoose.Types.ObjectId;
  reportId: string;
  reporterId: mongoose.Types.ObjectId;
  hazardType: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  photoUrl?: string;
  status: HazardReportStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HazardReportSchema = new Schema<IHazardReport>(
  {
    reportId: { type: String, required: true, unique: true },
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hazardType: { type: String, required: true },
    locationName: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    description: { type: String, required: true },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"],
      default: "PENDING_VERIFICATION",
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationNotes: { type: String },
  },
  { timestamps: true }
);

const HazardReport: Model<IHazardReport> =
  mongoose.models.HazardReport || mongoose.model<IHazardReport>("HazardReport", HazardReportSchema);

export default HazardReport;
