import mongoose, { Schema, Document, Model } from "mongoose";

export type DispatchStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "REJECTED";

export interface ISelectedResourceItem {
  resourceId?: mongoose.Types.ObjectId | string;
  resourceName: string;
  category: string;
  quantity: number;
  unit: string;
}

export interface ILocationCoordinates {
  latitude: number;
  longitude: number;
  locationName?: string;
}

export interface IAffectedAreaSpec {
  districtName: string;
  coordinates?: {
    type: "Polygon";
    coordinates: number[][][];
  };
  estimatedReach?: number;
}

export interface IDispatchOrder extends Document {
  _id: mongoose.Types.ObjectId;
  dispatchOrderId: string;
  incident?: mongoose.Types.ObjectId;
  affectedArea: IAffectedAreaSpec;
  selectedResources: ISelectedResourceItem[];
  agencies: string[];
  responsibleTeam?: string;
  estimatedArrival?: Date | string;
  dispatchStatus: DispatchStatus;
  currentLocation?: ILocationCoordinates;
  dispatchedTime?: Date | null;
  deliveredTime?: Date | null;
  dispatchedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SelectedResourceItemSchema = new Schema<ISelectedResourceItem>(
  {
    resourceId: { type: Schema.Types.Mixed },
    resourceName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true, default: "units" },
  },
  { _id: false }
);

const LocationCoordinatesSchema = new Schema<ILocationCoordinates>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationName: { type: String },
  },
  { _id: false }
);

const AffectedAreaSpecSchema = new Schema<IAffectedAreaSpec>(
  {
    districtName: { type: String, required: true },
    coordinates: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
      },
      coordinates: [[[Number]]],
    },
    estimatedReach: { type: Number },
  },
  { _id: false }
);

const DispatchOrderSchema = new Schema<IDispatchOrder>(
  {
    dispatchOrderId: { type: String, required: true, unique: true, index: true },
    incident: { type: Schema.Types.ObjectId, ref: "Incident", required: false },
    affectedArea: { type: AffectedAreaSpecSchema, required: true },
    selectedResources: { type: [SelectedResourceItemSchema], required: true },
    agencies: { type: [String], required: true, default: ["DMC"] },
    responsibleTeam: { type: String, required: false },
    estimatedArrival: { type: Schema.Types.Mixed },
    dispatchStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "REJECTED"],
      default: "PENDING",
      required: true,
      index: true,
    },
    currentLocation: { type: LocationCoordinatesSchema },
    dispatchedTime: { type: Date, default: null },
    deliveredTime: { type: Date, default: null },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

const DispatchOrder: Model<IDispatchOrder> =
  mongoose.models.DispatchOrder ||
  mongoose.model<IDispatchOrder>("DispatchOrder", DispatchOrderSchema);

export default DispatchOrder;
