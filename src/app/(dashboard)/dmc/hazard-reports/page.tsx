import HazardTable from "@/components/hazard/HazardTable";
import connectMongo from "@/lib/db/connectMongo";
import HazardReport from "@/lib/models/HazardReport";
import { CheckCircle2, ClipboardList, Clock3, ShieldCheck } from "lucide-react";

export default async function Page() {
  await connectMongo();

  const reports = await HazardReport.find({}).sort({ createdAt: -1 }).lean();
  const pendingCount = reports.filter((report) => report.status === "PENDING_VERIFICATION").length;
  const verifiedCount = reports.filter((report) => report.status === "VERIFIED").length;
  const pendingReports = reports.filter((report) => report.status === "PENDING_VERIFICATION");
  const reviewedReports = reports.filter((report) => report.status !== "PENDING_VERIFICATION");

  const summaryCards = [
    {
      label: "Total reports",
      value: reports.length,
      icon: ClipboardList,
      color: "border-slate-700 bg-slate-900/80 text-slate-300",
      iconColor: "bg-slate-800 text-slate-300",
    },
    {
      label: "Pending verification",
      value: pendingCount,
      icon: Clock3,
      color: "border-amber-500/20 bg-amber-500/5 text-amber-200",
      iconColor: "bg-amber-500/10 text-amber-400",
    },
    {
      label: "Verified reports",
      value: verifiedCount,
      icon: CheckCircle2,
      color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200",
      iconColor: "bg-emerald-500/10 text-emerald-400",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/20">
        <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                DMC verification queue
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Hazard Reports Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Review citizen-submitted evidence and verify reports before emergency coordination begins.
              </p>
            </div>
          </div>

          <div className="self-start rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
            {pendingCount} awaiting review
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconColor}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <HazardTable
        reports={JSON.parse(JSON.stringify(pendingReports))}
        title="Pending verification queue"
        subtitle="Reports that require a DMC officer decision"
      />

      <HazardTable
        reports={JSON.parse(JSON.stringify(reviewedReports))}
        title="Reviewed reports"
        subtitle="Previously verified and rejected submissions"
      />
    </section>
  );
}
