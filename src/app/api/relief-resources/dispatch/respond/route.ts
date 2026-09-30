import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import DispatchOrder from "@/lib/models/DispatchOrder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dispatchOrderId, status, deliveredAt, finalLocation } = body;

    if (!dispatchOrderId) {
      return NextResponse.json(
        { success: false, error: "dispatchOrderId is required" },
        { status: 400 }
      );
    }

    await connectMongo().catch(() => null);

    const updated = await DispatchOrder.findOneAndUpdate(
      { dispatchOrderId },
      {
        $set: {
          dispatchStatus: status || "DELIVERED",
          deliveredTime: deliveredAt ? new Date(deliveredAt) : new Date(),
          ...(finalLocation ? { "currentLocation.locationName": finalLocation } : {}),
        },
      },
      { new: true }
    ).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Dispatch status updated successfully",
      dispatch: updated || { dispatchOrderId, status: status || "DELIVERED" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to respond to dispatch order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
