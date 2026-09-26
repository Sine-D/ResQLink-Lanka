import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongo from "@/lib/db/connectMongo";
import { rejectHazardReport } from "@/lib/services/hazardReportService";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const session = await getServerSession(authOptions);
    const officer = session?.user as { id?: string; role?: string } | undefined;

    if (!officer?.id || officer.role !== "DMC_OFFICER") {
      return NextResponse.json({ message: "DMC officer access is required" }, { status: 403 });
    }

    const body = await request.json();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!reason) {
      return NextResponse.json({ message: "A rejection reason is required" }, { status: 400 });
    }

    await connectMongo();
    const updated = await rejectHazardReport(reportId, officer.id, reason);

    if (!updated) {
      return NextResponse.json(
        { message: "Report was not found or has already been reviewed" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Hazard rejected",
      report: updated,
    });
  } catch {
    return NextResponse.json({ message: "Rejection failed" }, { status: 500 });
  }
}
