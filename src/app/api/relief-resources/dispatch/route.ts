import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import DispatchOrder from "@/lib/models/DispatchOrder";

export async function GET() {
  try {
    await connectMongo().catch(() => null);
    const dispatches = await DispatchOrder.find().sort({ createdAt: -1 }).lean().catch(() => []);

    return NextResponse.json({
      success: true,
      dispatches: dispatches || [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch dispatch orders", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
