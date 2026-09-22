import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationChannel = "PUSH" | "SMS" | "BOTH";
export type NotificationStatus = "SENT" | "FAILED" | "PENDING_DISPATCH";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  notificationId: string;
  warningId: mongoose.Types.ObjectId;
  channel: NotificationChannel;
  message: string;
  status: NotificationStatus;
  sentAt: Date | null;
  retryCount: number;
  errorLog: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    warningId: { type: Schema.Types.ObjectId, ref: "Warning", required: true, index: true },
    channel: {
      type: String,
      enum: ["PUSH", "SMS", "BOTH"],
      default: "BOTH",
      required: true,
    },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "PENDING_DISPATCH"],
      default: "PENDING_DISPATCH",
      required: true,
    },
    sentAt: { type: Date, default: null },
    retryCount: { type: Number, default: 0 },
    errorLog: { type: String, default: null },
  },
  { timestamps: true }
);

const NotificationModel: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default NotificationModel;
