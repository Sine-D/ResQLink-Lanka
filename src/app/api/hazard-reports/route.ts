import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import HazardReport from "@/lib/models/HazardReport";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventBus } from "@/core/infrastructure/event-bus/EventBus";
import { HazardReportEvents } from "@/core/domain/events/HazardReportEvents";


// GET ALL REPORTS
export async function GET() {

  try {

    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string } | undefined)?.role;

    if (userRole !== "DMC_OFFICER") {
      return NextResponse.json({ error: "DMC officer access is required" }, { status: 403 });
    }

    await connectMongo();

    const reports =
      await HazardReport
        .find({})
        .sort({
          createdAt: -1
        });


    return NextResponse.json({
      reports
    });


  } catch (err: unknown) {


    const message =
      err instanceof Error
        ? err.message
        : "Failed to fetch hazard reports";


    return NextResponse.json(
      {
        error: message
      },
      {
        status: 500
      }
    );

  }

}



// CREATE HAZARD REPORT
export async function POST(req: Request) {


  try {


    const session =
      await getServerSession(authOptions);


    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    const reporterId = sessionUser?.id;

    if (!reporterId || sessionUser?.role !== "CITIZEN") {
      return NextResponse.json(
        { error: "A signed-in citizen account is required to submit a hazard report" },
        { status: 403 }
      );
    }



    const body =
      await req.json();

const description =
  typeof body.description === "string"
    ? body.description.trim()
    : "";

const hazardType =
  typeof body.hazardType === "string"
    ? body.hazardType
    : "";

const allowedHazards = [
  "Flood",
  "Landslide",
  "Tsunami",
  "Storm",
  "Fire",
];

const locationSource =
  body.locationSource === "MANUAL"
    ? "MANUAL"
    : "GPS";

const locationName =
  typeof body.locationName === "string"
    ? body.locationName.trim()
    : "";

const latitude = Number(
  body.coordinates?.latitude ??
    body.coordinates?.lat
);

const longitude = Number(
  body.coordinates?.longitude ??
    body.coordinates?.lng
);

const accuracyValue = Number(
  body.coordinates?.accuracy
);

const accuracy =
  Number.isFinite(accuracyValue)
    ? Math.max(0, accuracyValue)
    : undefined;

const photoUrl =
  typeof body.photoUrl === "string"
    ? body.photoUrl.trim()
    : "";

const clientReportId =
  typeof body.clientReportId === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    body.clientReportId
  )
    ? body.clientReportId
    : crypto.randomUUID();

if (
  !description ||
  description.length > 500 ||
  !allowedHazards.includes(hazardType)
) {
  return NextResponse.json(
    {
      error:
        "A valid hazard type and description are required",
    },
    {
      status: 400,
    }
  );
}

if (locationSource === "GPS") {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      {
        error:
          "Valid GPS coordinates are required",
      },
      {
        status: 400,
      }
    );
  }
}

if (
  locationSource === "MANUAL" &&
  locationName.length < 3
) {
  return NextResponse.json(
    {
      error:
        "Please provide a valid location description",
    },
    {
      status: 400,
    }
  );
}

/*
 * Photo evidence is OPTIONAL.
 * But if the user supplies one, validate it.
 */
if (photoUrl) {
  const dataImageMatch = photoUrl.match(
    /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i
  );

  const remoteImage =
    /^https?:\/\//i.test(photoUrl);

  if (!dataImageMatch && !remoteImage) {
    return NextResponse.json(
      {
        error:
          "The attached evidence must be a valid image",
      },
      {
        status: 400,
      }
    );
  }

  if (dataImageMatch) {
    const base64 = dataImageMatch[2];

    const approximateBytes =
      Math.ceil(
        (base64.length * 3) / 4
      );

    const fiveMB =
      5 * 1024 * 1024;

    if (approximateBytes > fiveMB) {
      return NextResponse.json(
        {
          error:
            "The evidence photo must be smaller than 5 MB",
        },
        {
          status: 400,
        }
      );
    }
  }
}

await connectMongo();

const existingReport =
  await HazardReport.findOne({
    reportId: clientReportId,
    reporterId,
  });

if (existingReport) {
  return NextResponse.json({
    message:
      "Hazard report already synchronized",

    report: existingReport,
  });
}

const report =
  await HazardReport.create({
    reportId: clientReportId,

    reporterId,

    hazardType,

    locationName:
      locationName ||
      "Live GPS location",

    locationSource,

    ...(locationSource === "GPS"
      ? {
          coordinates: {
            latitude,
            longitude,
            accuracy,
          },
        }
      : {}),

    description,

    ...(photoUrl
      ? {
          photoUrl,
        }
      : {}),

    status:
      "PENDING_VERIFICATION",

    clarifications: [],
  });



    // EVENT TRIGGER
    eventBus.publish({
      eventId: `${HazardReportEvents.HAZARD_REPORT_CREATED}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      eventName: HazardReportEvents.HAZARD_REPORT_CREATED,
      occurredOn: new Date(),
      payload: {
        reportId: report.reportId,
        reporterId: report.reporterId,
        hazardType: report.hazardType,
        locationName: report.locationName,
      },
    });



    return NextResponse.json(

      {
        message:
          "Hazard report submitted",

        report

      },

      {
        status:201
      }

    );



  } catch (err: unknown) {


    const message =
      err instanceof Error
        ? err.message
        : "Failed to submit hazard report";


    return NextResponse.json(

      {
        error:message
      },

      {
        status:500
      }

    );

  }

}
