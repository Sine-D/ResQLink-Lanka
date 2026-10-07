import mongoose, { Schema, Document, Model } from "mongoose";

export type HazardReportStatus =
  | "PENDING_VERIFICATION"
  | "MORE_INFO_REQUIRED"
  | "VERIFIED"
  | "REJECTED";

export type HazardLocationSource = "GPS" | "MANUAL";

export interface IHazardClarification {
  requestedBy: mongoose.Types.ObjectId;
  requestMessage: string;
  requestedAt: Date;
  citizenResponse?: string;
  respondedAt?: Date;
}

export interface IHazardReport extends Document {
  _id: mongoose.Types.ObjectId;

  reportId: string;

  reporterId: mongoose.Types.ObjectId;

  hazardType: string;

  locationName: string;

  locationSource: HazardLocationSource;

  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  description: string;

  photoUrl?: string;

  status: HazardReportStatus;

  clarifications: IHazardClarification[];

  verifiedBy?: mongoose.Types.ObjectId;

  verificationNotes?: string;

  reviewedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

const HazardCoordinatesSchema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    accuracy: {
      type: Number,
      required: false,
    },
  },
  {
    _id: false,
  }
);

const HazardClarificationSchema = new Schema(
  {
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestMessage: {
      type: String,
      required: true,
      trim: true,
    },

    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    citizenResponse: {
      type: String,
      trim: true,
    },

    respondedAt: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

const HazardReportSchema = new Schema<IHazardReport>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },

    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hazardType: {
      type: String,
      required: true,
    },

    locationName: {
      type: String,
      required: true,
      trim: true,
    },

    locationSource: {
      type: String,
      enum: ["GPS", "MANUAL"],
      default: "GPS",
      required: true,
    },

    coordinates: {
      type: HazardCoordinatesSchema,
      required: false,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    photoUrl: {
      type: String,
      required: false,
    },

    status: {
      type: String,

      enum: [
        "PENDING_VERIFICATION",
        "MORE_INFO_REQUIRED",
        "VERIFIED",
        "REJECTED",
      ],

      default: "PENDING_VERIFICATION",
    },

    clarifications: {
      type: [HazardClarificationSchema],
      default: [],
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    verificationNotes: {
      type: String,
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const HazardReport: Model<IHazardReport> =
  mongoose.models.HazardReport ||
  mongoose.model<IHazardReport>(
    "HazardReport",
    HazardReportSchema
  );

export default HazardReport;