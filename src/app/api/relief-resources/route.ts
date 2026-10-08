import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodError } from "zod";
import {
  listAvailableResources,
  allocateMultiAgencyResources,
  InsufficientStockError,
  ResourceUnavailableError,
  ResourceNotFoundError,
} from "@/lib/services/reliefResourceService";
import { ResourceCategory, AvailabilityStatus } from "@/lib/models/ReliefResource";

export async function GET(req: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);

    const category = (searchParams.get("category") || searchParams.get("resourceType")) as ResourceCategory | undefined;
    const agency = searchParams.get("agency") || undefined;
    const district = (searchParams.get("district") || searchParams.get("location")) || undefined;
    const status = searchParams.get("status") as AvailabilityStatus | undefined;
    const minQuantityParam = searchParams.get("minQuantity");
    const minQuantity = minQuantityParam ? Number(minQuantityParam) : undefined;

    const resources = await listAvailableResources({
      category: category || undefined,
      agency,
      district,
      status,
      minQuantity,
    });

    return NextResponse.json({ resources });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch relief resources";
    return NextResponse.json({ error: "SERVER_ERROR", message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication required" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "DMC_OFFICER" && userRole !== "DISTRICT_OFFICER") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Officer authorization required" }, { status: 403 });
    }

    const officerId = (session.user as { id: string }).id;
    const body = await req.json();

    await connectMongo();

    // Check if request is a multi-agency batch input or single item input
    let allocationPayload;
    if (body.items && Array.isArray(body.items)) {
      allocationPayload = body;
    } else {
      allocationPayload = {
        items: [
          {
            resourceId: body.resourceId || "RES-WATER-01",
            quantity: Number(body.quantity) || 10,
            agency: body.agency || "Government",
          },
        ],
        district: body.district || "Colombo",
        centerName: body.centerName,
        requirementNotes: body.notes,
      };
    }

    const result = await allocateMultiAgencyResources(allocationPayload, officerId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: err.issues[0].message, details: err.issues },
        { status: 422 }
      );
    }

    if (err instanceof InsufficientStockError || err instanceof ResourceUnavailableError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 400 }
      );
    }

    if (err instanceof ResourceNotFoundError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 404 }
      );
    }

    const message = err instanceof Error ? err.message : "Distribution failed";
    return NextResponse.json({ error: "SERVER_ERROR", message }, { status: 500 });
  }
}
