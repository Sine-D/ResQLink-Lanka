import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHouseholdMember {
  name: string;
  age: number;
  details: string;
}

export interface IEvacuee extends Document {
  _id: mongoose.Types.ObjectId;
  caseId: string;
  headOfHousehold: string;
  headOfHouseholdAge: number;
  householdSize: number;
  vulnerability: string;
  originAddress: string;
  contactNumber: string;
  gpsStatus: string;
  householdMembers: IHouseholdMember[];
  allocatedShelterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdMemberSchema = new Schema<IHouseholdMember>({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  details: { type: String, default: "" },
});

const EvacueeSchema = new Schema<IEvacuee>(
  {
    caseId: { type: String, required: true, unique: true },
    headOfHousehold: { type: String, required: true },
    headOfHouseholdAge: { type: Number, required: true, default: 0 },
    householdSize: { type: Number, required: true, default: 1 },
    vulnerability: { type: String, default: "" },
    originAddress: { type: String, required: true },
    contactNumber: { type: String, default: "" },
    gpsStatus: { type: String, default: "" },
    householdMembers: { type: [HouseholdMemberSchema], default: [] },
    allocatedShelterId: { type: String, default: null },
  },
  { timestamps: true }
);

if (mongoose.models.Evacuee) {
  delete mongoose.models.Evacuee;
}

const Evacuee: Model<IEvacuee> = mongoose.model<IEvacuee>("Evacuee", EvacueeSchema);

export default Evacuee;
