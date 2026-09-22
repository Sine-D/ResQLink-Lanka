import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { getWarningById } from "@/lib/services/warningService";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    const warning = await getWarningById(params.id);

    if (!warning) {
      return NextResponse.json({ error: "Warning record not found" }, { status: 404 });
    }

    return NextResponse.json({ warning });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
