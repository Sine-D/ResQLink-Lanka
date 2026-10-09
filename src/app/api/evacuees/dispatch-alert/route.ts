import { NextRequest, NextResponse } from "next/server";
import { EvacueeMongoRepository } from "@/lib/repositories/EvacueeMongoRepository";
import { SmsServiceFactory } from "@/lib/services/sms/SmsServiceFactory";
import { AlertDispatchService } from "@/lib/services/alert/AlertDispatchService";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Dependency Injection Setup (DIP)
    const repository = new EvacueeMongoRepository();
    const smsProvider = SmsServiceFactory.getProvider();
    
    // Application Service Execution (SRP)
    const alertService = new AlertDispatchService(repository, smsProvider);
    const successCount = await alertService.dispatchToAll(message);
    
    return NextResponse.json({ success: true, count: successCount }, { status: 200 });

  } catch (error) {
    console.error("Error dispatching alert:", error);
    return NextResponse.json({ error: "Failed to dispatch alert" }, { status: 500 });
  }
}




