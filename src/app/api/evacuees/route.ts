import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Evacuee from "@/lib/models/Evacuee";

export async function GET() {
  try {
    await connectMongo();
    const evacuees = await Evacuee.find().sort({ createdAt: -1 });
    return NextResponse.json({ evacuees }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch evacuees:", error);
    return NextResponse.json({ error: "Failed to fetch evacuees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await connectMongo();

    // Generate a case ID if not provided
    if (!data.caseId) {
      data.caseId = `#EV-${Math.floor(10000 + Math.random() * 90000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    }

    const newEvacuee = new Evacuee(data);
    await newEvacuee.save();

    return NextResponse.json(
      { message: "Evacuee registered successfully", evacuee: newEvacuee },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to register evacuee:", error);
    return NextResponse.json({ error: "Failed to register evacuee" }, { status: 500 });
  }
}
