import mongoose, { Schema, Document } from "mongoose";

export interface ITelemetryDocument extends Document {
  sensorId: string;
  districtName: string;
  hazardType: string;
  metricName: string;
  metricValue: number;
  unit: string;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  timestamp: Date;
}

const TelemetrySchema = new Schema<ITelemetryDocument>(
  {
    sensorId: { type: String, required: true, index: true },
    districtName: { type: String, required: true, index: true },
    hazardType: { type: String, required: true },
    metricName: { type: String, required: true },
    metricValue: { type: Number, required: true },
    unit: { type: String, required: true, default: "m" },
    status: {
      type: String,
      enum: ["NORMAL", "WARNING", "CRITICAL"],
      default: "NORMAL",
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Telemetry ||
  mongoose.model<ITelemetryDocument>("Telemetry", TelemetrySchema);
