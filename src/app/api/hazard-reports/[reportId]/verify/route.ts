import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongo from "@/lib/db/connectMongo";
import { verifyHazardReport } from "@/lib/services/hazardReportService";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const session = await getServerSession(authOptions);
    const officer = session?.user as { id?: string; role?: string } | undefined;

    if (!officer?.id || officer.role !== "DMC_OFFICER") {
      return NextResponse.json({ message: "DMC officer access is required" }, { status: 403 });
    }

    await connectMongo();

    const updated = await verifyHazardReport(reportId, officer.id);

    if (!updated) {
      return NextResponse.json(
        { message: "Report was not found or has already been reviewed" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Hazard verified successfully",
      report: updated,
    });
  } catch {
    return NextResponse.json({ message: "Verification failed" }, { status: 500 });
  }
}
