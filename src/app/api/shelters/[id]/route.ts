import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Shelter from "@/lib/models/Shelter";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    if (data.capacity !== undefined && data.occupancy !== undefined) {
      if (data.occupancy >= data.capacity) {
         data.status = "FULL";
      } else if (data.occupancy >= data.capacity * 0.8) {
         data.status = "NEAR CAPACITY";
      } else {
         data.status = "AVAILABLE";
      }
    }

    const updatedShelter = await Shelter.findByIdAndUpdate(id, data, { new: true });
    
    if (!updatedShelter) {
      return NextResponse.json({ error: "Shelter not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Shelter updated successfully", shelter: updatedShelter },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update shelter:", error);
    return NextResponse.json({ error: "Failed to update shelter" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectMongo();
    const { id } = await params;
    
    const deletedShelter = await Shelter.findByIdAndDelete(id);
    
    if (!deletedShelter) {
      return NextResponse.json({ error: "Shelter not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Shelter deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete shelter:", error);
    return NextResponse.json({ error: "Failed to delete shelter" }, { status: 500 });
  }
}
