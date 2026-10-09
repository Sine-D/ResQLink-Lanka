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

    const notifyUserId = "33277";
    const notifyApiKey = "t9y5P2zdTTPXWlo8z4DZ";
    const senderId = "NotifyDEMO"; // Default sender ID for free/trial Notify.lk accounts

    let successCount = 0;
    
    for (const e of evacuees) {
      try {
        // Format number to 947XXXXXXXX
        let toPhone = e.contactNumber.trim();
        if (toPhone.startsWith('0')) {
          toPhone = '94' + toPhone.substring(1);
        } else if (toPhone.startsWith('+94')) {
          toPhone = toPhone.substring(1);
        }

        const notifyUrl = `https://app.notify.lk/api/v1/send`;
        const formData = new URLSearchParams({
          user_id: notifyUserId,
          api_key: notifyApiKey,
          sender_id: senderId,
          to: toPhone,
          message: message
        });

        // Send real SMS via Notify.lk REST API
        const notifyRes = await fetch(notifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });

        if (notifyRes.ok) {
          const resData = await notifyRes.json();
          if (resData.status === "success") {
            successCount++;
          } else {
            console.error(`Notify.lk API Error for ${toPhone}:`, resData);
          }
        } else {
          const errData = await notifyRes.text();
          console.error(`Notify.lk HTTP Error for ${toPhone}:`, errData);
        }
      } catch (smsError) {
        console.error(`Failed to send SMS to ${e.contactNumber}:`, smsError);
      }
    }
    
    return NextResponse.json({ success: true, count: successCount }, { status: 200 });

  } catch (error) {
    console.error("Error dispatching alert:", error);
    return NextResponse.json({ error: "Failed to dispatch alert" }, { status: 500 });
  }
}



