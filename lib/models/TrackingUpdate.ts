import mongoose, { Schema, Document, Model } from "mongoose";
import { DispatchStatus, ILocationCoordinates } from "./DispatchOrder";

export interface ITrackingUpdate extends Document {
  _id: mongoose.Types.ObjectId;
  trackingUpdateId: string;
  dispatchOrder: mongoose.Types.ObjectId;
  location: ILocationCoordinates;
  status: DispatchStatus;
  updatedBy?: mongoose.Types.ObjectId;
  notes?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LocationCoordinatesSchema = new Schema<ILocationCoordinates>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationName: { type: String },
  },
  { _id: false }
);

const TrackingUpdateSchema = new Schema<ITrackingUpdate>(
  {
    trackingUpdateId: { type: String, required: true, unique: true, index: true },
    dispatchOrder: { type: Schema.Types.ObjectId, ref: "DispatchOrder", required: true, index: true },
    location: { type: LocationCoordinatesSchema, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "REJECTED"],
      required: true,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true }
);

const TrackingUpdate: Model<ITrackingUpdate> =
  mongoose.models.TrackingUpdate ||
  mongoose.model<ITrackingUpdate>("TrackingUpdate", TrackingUpdateSchema);

export default TrackingUpdate;
