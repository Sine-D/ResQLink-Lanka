import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Crosshair, FileText, MapPin, ShieldCheck, TriangleAlert, UserRound } from "lucide-react";
import connectMongo from "@/lib/db/connectMongo";
import HazardReport from "@/lib/models/HazardReport";
import StatusBadge from "@/components/hazard/StatusBadge";
import ReviewActions from "@/components/hazard/ReviewActions";

export default async function Page({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;

  await connectMongo();
  const report = await HazardReport.findOne({ reportId }).lean();

  if (!report) notFound();

  const submittedAt = new Intl.DateTimeFormat("en-LK", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(report.createdAt));

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5">
      <Link
        href="/dmc/hazard-reports"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to hazard reports
      </Link>

      <article className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/20">
        <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400" />

        <header className="flex flex-col gap-5 border-b border-slate-800 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <TriangleAlert className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Hazard verification</p>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Review Hazard Report</h1>
              <p className="mt-2 font-mono text-xs text-slate-500">Reference: {report.reportId}</p>
            </div>
          </div>
          <StatusBadge status={report.status} />
        </header>

        <div className="space-y-7 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard icon={TriangleAlert} label="Hazard type" value={report.hazardType} accent="text-red-400" />
            <InfoCard icon={MapPin} label="Location" value={report.locationName} accent="text-amber-400" />
            <InfoCard
              icon={Crosshair}
              label="GPS coordinates"
              value={`${report.coordinates.latitude.toFixed(6)}, ${report.coordinates.longitude.toFixed(6)}${
                report.coordinates.accuracy ? ` (±${Math.round(report.coordinates.accuracy)} m)` : ""
              }`}
              accent="text-emerald-400"
            />
            <InfoCard icon={CalendarClock} label="Submitted" value={submittedAt} accent="text-sky-400" />
            <InfoCard
              icon={UserRound}
              label="Reporter ID"
              value={String(report.reporterId)}
              accent="text-violet-400"
            />
            {report.verifiedBy && (
              <InfoCard
                icon={ShieldCheck}
                label="Reviewed by officer"
                value={String(report.verifiedBy)}
                accent="text-emerald-400"
              />
            )}
            {report.reviewedAt && (
              <InfoCard
                icon={CalendarClock}
                label="Decision recorded"
                value={new Intl.DateTimeFormat("en-LK", {
                  dateStyle: "long",
                  timeStyle: "short",
                }).format(new Date(report.reviewedAt))}
                accent="text-cyan-400"
              />
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Citizen description
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{report.description}</p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">Evidence photo</h2>
            {report.photoUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <Image
                  src={report.photoUrl}
                  alt={`Evidence for ${report.hazardType} report`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-500">
                No evidence photo was attached to this report.
              </div>
            )}
          </div>

          {report.verificationNotes && (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{report.verificationNotes}</p>
            </div>
          )}

          <ReviewActions reportId={report.reportId} status={report.status} />
        </div>
      </article>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof TriangleAlert;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 ${accent}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-200" title={value}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
