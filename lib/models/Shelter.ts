import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShelter extends Document {
  _id: mongoose.Types.ObjectId;
  shelterId: string;
  name: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
  occupancy: number;
  averageFamilySize: number;
  contactPhone: string;
  contactPerson: string;
  facilities: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShelterSchema = new Schema<IShelter>(
  {
    shelterId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    capacity: { type: Number, required: true },
    occupancy: { type: Number, default: 0 },
    averageFamilySize: { type: Number, default: 4 },
    contactPhone: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    facilities: { type: String, default: "" },
    status: { type: String, default: "AVAILABLE" },
  },
  { timestamps: true }
);

const Shelter: Model<IShelter> =
  mongoose.models.Shelter || mongoose.model<IShelter>("Shelter", ShelterSchema);

export default Shelter;
