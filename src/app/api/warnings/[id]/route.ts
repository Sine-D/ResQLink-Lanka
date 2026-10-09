import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { getWarningById, updateDraft, InvalidTargetAreaError } from "@/lib/services/warningService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodError } from "zod";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectMongo();
    const warning = await getWarningById(id);

    if (!warning) {
      return NextResponse.json({ error: "Warning record not found" }, { status: 404 });
    }

    return NextResponse.json({ warning });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "DMC_OFFICER") {
      return NextResponse.json(
        { error: "Forbidden: Only DMC Officers can update warning drafts" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    await connectMongo();
    const updated = await updateDraft(id, body);

    return NextResponse.json({ warning: updated, message: "Draft updated successfully" });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: err.issues[0]?.message || "Validation failed",
          details: err.issues,
        },
        { status: 422 }
      );
    }
    if (err instanceof InvalidTargetAreaError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 422 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update draft";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

