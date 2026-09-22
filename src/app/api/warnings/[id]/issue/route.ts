import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { issueWarning, InvalidTargetAreaError, WarningNotFoundError } from "@/lib/services/warningService";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectMongo();
    const issuedWarning = await issueWarning(id);

    return NextResponse.json({
      message: "Warning issued and dispatched successfully",
      warning: issuedWarning,
    });
  } catch (err: unknown) {
    if (err instanceof InvalidTargetAreaError) {
      return NextResponse.json(
        {
          error: "NO_COVERAGE",
          message: err.message,
        },
        { status: 422 }
      );
    }
    if (err instanceof WarningNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to issue warning";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
