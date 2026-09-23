import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { createDraft, listActiveWarnings, listAllWarnings, InvalidTargetAreaError } from "@/lib/services/warningService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodError } from "zod";

export async function GET(req: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district") || undefined;
    const mode = searchParams.get("mode") || "all";

    if (mode === "active") {
      const active = await listActiveWarnings(district);
      return NextResponse.json({ warnings: active });
    }

    const all = await listAllWarnings();
    return NextResponse.json({ warnings: all });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch warnings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "DMC_OFFICER") {
      return NextResponse.json({ error: "Forbidden: Only DMC Officers can create warning drafts" }, { status: 403 });
    }

    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    await connectMongo();

    const draft = await createDraft(body, userId);
    return NextResponse.json({ warning: draft }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: err.issues[0].message, details: err.issues },
        { status: 422 }
      );
    }
    if (err instanceof InvalidTargetAreaError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 422 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create warning draft";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
