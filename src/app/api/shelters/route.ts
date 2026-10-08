import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Shelter from "@/lib/models/Shelter";

export async function GET() {
  try {
    await connectMongo();
    const shelters = await Shelter.find().sort({ createdAt: -1 });
    return NextResponse.json({ shelters }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch shelters:", error);
    return NextResponse.json({ error: "Failed to fetch shelters" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await connectMongo();

    // Generate a shelter ID if not provided
    if (!data.shelterId) {
      const count = await Shelter.countDocuments();
      data.shelterId = `SH-${String(count + 1).padStart(3, '0')}`;
    }
    
    if (data.capacity !== undefined && data.occupancy !== undefined) {
      if (data.occupancy >= data.capacity) {
         data.status = "FULL";
      } else if (data.occupancy >= data.capacity * 0.8) {
         data.status = "NEAR CAPACITY";
      } else {
         data.status = "AVAILABLE";
      }
    }

    const newShelter = new Shelter(data);
    await newShelter.save();

    return NextResponse.json(
      { message: "Shelter registered successfully", shelter: newShelter },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to register shelter:", error);
    return NextResponse.json({ error: "Failed to register shelter" }, { status: 500 });
  }
}
