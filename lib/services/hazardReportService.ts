import HazardReport from "@/lib/models/HazardReport";

export async function getAllHazardReports() {
  return HazardReport.find({})
    .sort({ createdAt: -1 });
}

export async function getHazardReportById(
  reportId: string
) {
  return HazardReport.findOne({ reportId });
}

export async function verifyHazardReport(
  reportId: string,
  officerId: string,
  notes?: string
) {
  return HazardReport.findOneAndUpdate(
    {
      reportId,
      status: "PENDING_VERIFICATION",
    },

    {
      status: "VERIFIED",

      verifiedBy: officerId,

      verificationNotes:
        notes?.trim() ||
        "Verified by DMC Officer",

      reviewedAt: new Date(),
    },

    {
      new: true,
    }
  );
}

export async function rejectHazardReport(
  reportId: string,
  officerId: string,
  notes: string
) {
  return HazardReport.findOneAndUpdate(
    {
      reportId,
      status: "PENDING_VERIFICATION",
    },

    {
      status: "REJECTED",

      verifiedBy: officerId,

      verificationNotes: notes.trim(),

      reviewedAt: new Date(),
    },

    {
      new: true,
    }
  );
}

export async function requestAdditionalInformation(
  reportId: string,
  officerId: string,
  message: string
) {
  const requestMessage = message.trim();

  if (!requestMessage) {
    throw new Error(
      "Additional information request cannot be empty"
    );
  }

  return HazardReport.findOneAndUpdate(
    {
      reportId,
      status: "PENDING_VERIFICATION",
    },

    {
      $set: {
        status: "MORE_INFO_REQUIRED",
      },

      $push: {
        clarifications: {
          requestedBy: officerId,

          requestMessage,

          requestedAt: new Date(),
        },
      },
    },

    {
      new: true,
    }
  );
}

export async function respondToInformationRequest(
  reportId: string,
  reporterId: string,
  response: string
) {
  const citizenResponse = response.trim();

  if (!citizenResponse) {
    throw new Error(
      "Additional information response cannot be empty"
    );
  }

  return HazardReport.findOneAndUpdate(
    {
      reportId,

      reporterId,

      status: "MORE_INFO_REQUIRED",

      clarifications: {
        $elemMatch: {
          citizenResponse: {
            $exists: false,
          },
        },
      },
    },

    {
      $set: {
        "clarifications.$[pending].citizenResponse":
          citizenResponse,

        "clarifications.$[pending].respondedAt":
          new Date(),

        status: "PENDING_VERIFICATION",
      },
    },

    {
      new: true,

      arrayFilters: [
        {
          "pending.citizenResponse": {
            $exists: false,
          },
        },
      ],
    }
  );
}