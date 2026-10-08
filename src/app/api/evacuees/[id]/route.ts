import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Evacuee from "@/lib/models/Evacuee";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    const updatedEvacuee = await Evacuee.findByIdAndUpdate(id, data, { new: true });
    
    if (!updatedEvacuee) {
      return NextResponse.json({ error: "Evacuee not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Evacuee updated successfully", evacuee: updatedEvacuee },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update evacuee:", error);
    return NextResponse.json({ error: "Failed to update evacuee" }, { status: 500 });
  }
}
