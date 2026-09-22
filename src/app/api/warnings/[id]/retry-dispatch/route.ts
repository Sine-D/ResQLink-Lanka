import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { retryWarningDispatch, WarningNotFoundError } from "@/lib/services/warningService";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectMongo();
    const updated = await retryWarningDispatch(id);

    return NextResponse.json({
      message: "Retry dispatch completed",
      warning: updated,
    });
  } catch (err: unknown) {
    if (err instanceof WarningNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Retry dispatch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
