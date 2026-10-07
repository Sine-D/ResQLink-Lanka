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
  respondToInformationRequest
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

    const citizen =
      session?.user as
        | {
            id?: string;
            role?: string;
          }
        | undefined;

    if (
      !citizen?.id ||
      citizen.role !== "CITIZEN"
    ) {
      return NextResponse.json(
        {
          message:
            "Citizen access is required",
        },

        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const response =
      typeof body.response ===
      "string"
        ? body.response.trim()
        : "";

    if (!response) {
      return NextResponse.json(
        {
          message:
            "Please provide the requested information",
        },

        {
          status: 400,
        }
      );
    }

    await connectMongo();

    const updated =
      await respondToInformationRequest(
        reportId,
        citizen.id,
        response
      );

    if (!updated) {
      return NextResponse.json(
        {
          message:
            "There is no pending information request for this report",
        },

        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      message:
        "Additional information submitted successfully",

      report: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit additional information",
      },

      {
        status: 500,
      }
    );
  }
}