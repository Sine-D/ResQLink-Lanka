import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ClipboardClock } from "lucide-react";
import { authOptions } from "@/lib/auth";
import connectMongo from "@/lib/db/connectMongo";
import HazardReport from "@/lib/models/HazardReport";
import CitizenReportHistory from "@/components/hazard/CitizenReportHistory";
import PendingSyncReports from "@/components/hazard/PendingSyncReports";

export default async function CitizenHazardReportsPage() {
  const session = await getServerSession(authOptions);
  const reporterId = (session?.user as { id?: string } | undefined)?.id;

  if (!reporterId) {
    redirect("/signin?callbackUrl=/citizen/hazard-reports");
  }

  await connectMongo();
  const reports = await HazardReport.find({ reporterId })
    .select("reportId hazardType locationName coordinates description status verificationNotes photoUrl createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/20">
        <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400" />
        <div className="flex items-start gap-4 p-6 sm:p-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <ClipboardClock className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">Citizen report history</p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">My Hazard Reports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Track reports you submitted and see whether the Disaster Management Center has verified or rejected them.
            </p>
          </div>
        </div>
      </header>

      <PendingSyncReports />
      <CitizenReportHistory reports={JSON.parse(JSON.stringify(reports))} />
    </section>
  );
}
