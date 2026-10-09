import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import {
  getWarningDeliverySummary,
  checkAndExpireWarning,
  getWarningById,
  WarningNotFoundError,
} from "@/lib/services/warningService";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectMongo();

    // Auto-expire warning if EndTime (validUntil) is reached
    await checkAndExpireWarning(id);

    const warning = await getWarningById(id);
    if (!warning) {
      return NextResponse.json({ error: "Warning record not found" }, { status: 404 });
    }

    const summary = await getWarningDeliverySummary(id);

    return NextResponse.json({
      warning,
      summary,
    });
  } catch (err: unknown) {
    if (err instanceof WarningNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch delivery summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
