import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import Evacuee from "@/lib/models/Evacuee";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectMongo();
    
    // Fetch all evacuees with contact numbers
    const evacuees = await Evacuee.find({ contactNumber: { $exists: true, $ne: "" } });

    // In a real application, you would integrate an SMS API (like Twilio, Dialog SMS, or MSG91)
    // For now, we simulate the dispatch logic and log it to the console.
    console.log(`\n[SMS Gateway Mock] Dispatched alert to ${evacuees.length} numbers.`);
    console.log(`[Message]: "${message}"`);
    evacuees.forEach(e => console.log(` - Sent to: ${e.contactNumber} (${e.headOfHousehold})`));
    console.log("\n");

    return NextResponse.json({ success: true, count: evacuees.length }, { status: 200 });
  } catch (error) {
    console.error("Error dispatching alert:", error);
    return NextResponse.json({ error: "Failed to dispatch alert" }, { status: 500 });
  }
}
