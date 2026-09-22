import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "CITIZEN" | "DMC_OFFICER" | "DISTRICT_OFFICER" | "RESCUE_TEAM";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  district?: string;
  contactNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["CITIZEN", "DMC_OFFICER", "DISTRICT_OFFICER", "RESCUE_TEAM"],
      default: "CITIZEN",
      required: true,
    },
    district: { type: String, required: false },
    contactNo: { type: String, required: false },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
