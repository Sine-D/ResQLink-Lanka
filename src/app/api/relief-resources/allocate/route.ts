import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodError } from "zod";
import {
  allocateMultiAgencyResources,
  InsufficientStockError,
  ResourceUnavailableError,
  ResourceNotFoundError,
} from "@/lib/services/reliefResourceService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "DMC_OFFICER" && userRole !== "DISTRICT_OFFICER") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Officer authorization required" },
        { status: 403 }
      );
    }

    const officerId = (session.user as { id: string }).id;
    const body = await req.json();

    await connectMongo();

    const result = await allocateMultiAgencyResources(body, officerId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: err.issues[0].message,
          details: err.issues,
        },
        { status: 422 }
      );
    }

    if (
      err instanceof InsufficientStockError ||
      err instanceof ResourceUnavailableError
    ) {
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

    const message = err instanceof Error ? err.message : "Multi-agency resource allocation failed";
    return NextResponse.json({ error: "SERVER_ERROR", message }, { status: 500 });
  }
}
