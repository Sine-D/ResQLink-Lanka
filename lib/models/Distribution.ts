import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDistribution extends Document {
  _id: mongoose.Types.ObjectId;
  distributionId: string;
  resourceId: mongoose.Types.ObjectId;
  district: string;
  centerName: string;
  distributedQuantity: number;
  beneficiariesCount: number;
  officerInCharge: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DistributionSchema = new Schema<IDistribution>(
  {
    distributionId: { type: String, required: true, unique: true },
    resourceId: { type: Schema.Types.ObjectId, ref: "ReliefResource", required: true },
    district: { type: String, required: true },
    centerName: { type: String, required: true },
    distributedQuantity: { type: Number, required: true },
    beneficiariesCount: { type: Number, required: true },
    officerInCharge: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const Distribution: Model<IDistribution> =
  mongoose.models.Distribution ||
  mongoose.model<IDistribution>("Distribution", DistributionSchema);

export default Distribution;
