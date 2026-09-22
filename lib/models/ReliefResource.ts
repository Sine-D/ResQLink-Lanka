import mongoose, { Schema, Document, Model } from "mongoose";

export type ResourceCategory = "FOOD" | "WATER" | "MEDICAL" | "SHELTER" | "CLOTHING";

export interface IReliefResource extends Document {
  _id: mongoose.Types.ObjectId;
  resourceId: string;
  name: string;
  category: ResourceCategory;
  district: string;
  quantity: number;
  unit: string;
  minimumThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReliefResourceSchema = new Schema<IReliefResource>(
  {
    resourceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["FOOD", "WATER", "MEDICAL", "SHELTER", "CLOTHING"],
      required: true,
    },
    district: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    minimumThreshold: { type: Number, default: 100 },
  },
  { timestamps: true }
);

const ReliefResource: Model<IReliefResource> =
  mongoose.models.ReliefResource ||
  mongoose.model<IReliefResource>("ReliefResource", ReliefResourceSchema);

export default ReliefResource;
