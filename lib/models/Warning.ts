import mongoose, { Schema, Document, Model } from "mongoose";
import { ITargetArea } from "./TargetArea";

export type HazardType = "Flood" | "Landslide" | "Cyclone" | "Tsunami" | "Drought" | "FlashFlood";
export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";
export type WarningStatus = "DRAFT" | "ACTIVE" | "EXPIRED";
export type DispatchStatus = "NOT_SENT" | "SENT" | "PENDING_DISPATCH" | "FAILED";

export interface IWarning extends Document {
  _id: mongoose.Types.ObjectId;
  warningId: string; // UUID v4
  hazardType: HazardType;
  severity: SeverityLevel;
  status: WarningStatus;
  targetArea: ITargetArea;
  instructions: string;
  validFrom: Date;
  validUntil: Date;
  issuedBy: mongoose.Types.ObjectId;
  dispatchStatus: DispatchStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TargetAreaSchema = new Schema(
  {
    districtName: { type: String, required: true, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    estimatedReach: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const WarningSchema = new Schema<IWarning>(
  {
    warningId: { type: String, required: true, unique: true, index: true },
    hazardType: {
      type: String,
      enum: ["Flood", "Landslide", "Cyclone", "Tsunami", "Drought", "FlashFlood"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "EXPIRED"],
      default: "DRAFT",
      required: true,
    },
    targetArea: { type: TargetAreaSchema, required: true },
    instructions: { type: String, required: true, minlength: 10 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dispatchStatus: {
      type: String,
      enum: ["NOT_SENT", "SENT", "PENDING_DISPATCH", "FAILED"],
      default: "NOT_SENT",
      required: true,
    },
  },
  { timestamps: true }
);

const Warning: Model<IWarning> =
  mongoose.models.Warning || mongoose.model<IWarning>("Warning", WarningSchema);

export default Warning;
