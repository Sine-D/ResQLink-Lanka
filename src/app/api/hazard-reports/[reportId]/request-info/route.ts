import {
  NextResponse
} from "next/server";

import {
  getServerSession
} from "next-auth";

import {
  authOptions
} from "@/lib/auth";

import connectMongo from "@/lib/db/connectMongo";

import {
  requestAdditionalInformation
} from "@/lib/services/hazardReportService";

export async function PUT(
  request: Request,

  {
    params,
  }: {
    params:
      Promise<{
        reportId: string;
      }>;
  }
) {
  try {
    const {
      reportId,
    } = await params;

    const session =
      await getServerSession(
        authOptions
      );

    const officer =
      session?.user as
        | {
            id?: string;
            role?: string;
          }
        | undefined;

    if (
      !officer?.id ||
      officer.role !==
        "DMC_OFFICER"
    ) {
      return NextResponse.json(
        {
          message:
            "DMC officer access is required",
        },

        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const message =
      typeof body.message ===
      "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          message:
            "Please specify the information required from the citizen",
        },

        {
          status: 400,
        }
      );
    }

    await connectMongo();

    const updated =
      await requestAdditionalInformation(
        reportId,
        officer.id,
        message
      );

    if (!updated) {
      return NextResponse.json(
        {
          message:
            "Report was not found or is no longer pending verification",
        },

        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      message:
        "Additional information requested",

      report: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Request failed",
      },

      {
        status: 500,
      }
    );
  }
}