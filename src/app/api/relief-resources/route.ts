import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import ReliefResource from "@/lib/models/ReliefResource";
import Distribution from "@/lib/models/Distribution";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    await connectMongo();
    const resources = await ReliefResource.find({}).sort({ updatedAt: -1 });
    return NextResponse.json({ resources });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch relief resources";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "DMC_OFFICER" && userRole !== "DISTRICT_OFFICER") {
      return NextResponse.json({ error: "Forbidden: Officer authorization required" }, { status: 403 });
    }

    const officerId = (session.user as { id: string }).id;

    const body = await req.json();
    await connectMongo();

    const resource = await ReliefResource.findOne({ resourceId: body.resourceId });
    if (!resource) {
      return NextResponse.json({ error: "Relief resource not found" }, { status: 404 });
    }

    const deductQty = Number(body.quantity) || 10;
    if (resource.quantity < deductQty) {
      return NextResponse.json({ error: "Insufficient stock quantity" }, { status: 400 });
    }

    resource.quantity -= deductQty;
    await resource.save();

    const distribution = await Distribution.create({
      distributionId: uuidv4(),
      resourceId: resource._id,
      district: body.district || resource.district,
      centerName: body.centerName || "Central Relief Hub",
      distributedQuantity: deductQty,
      beneficiariesCount: body.beneficiariesCount || deductQty * 2,
      officerInCharge: officerId,
      notes: body.notes || "Emergency distribution log",
    });

    return NextResponse.json({ message: "Distribution logged and stock updated", distribution });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Distribution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
