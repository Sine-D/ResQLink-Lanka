import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, FileText, Inbox, MapPin, Plus, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface CitizenReport {
  reportId: string;
  hazardType: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  description: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  verificationNotes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CitizenReportHistory({ reports }: { reports: CitizenReport[] }) {
  const pending = reports.filter((report) => report.status === "PENDING_VERIFICATION").length;
  const verified = reports.filter((report) => report.status === "VERIFIED").length;
  const rejected = reports.filter((report) => report.status === "REJECTED").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Pending" value={pending} icon={Clock3} color="text-amber-400" />
        <Summary label="Verified" value={verified} icon={CheckCircle2} color="text-emerald-400" />
        <Summary label="Rejected" value={rejected} icon={XCircle} color="text-red-400" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-white">Submitted reports</h2>
            <p className="mt-0.5 text-xs text-slate-500">Newest reports appear first</p>
          </div>
          <Link
            href="/citizen/report-hazard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-500"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New report
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <Inbox className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-bold text-white">You have not submitted any reports</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
              When you report a hazard, its verification status will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {reports.map((report) => (
              <article key={report.reportId} className="p-5 transition hover:bg-slate-800/30 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-white">{report.hazardType}</h3>
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {report.locationName} · {report.coordinates.latitude.toFixed(5)}, {report.coordinates.longitude.toFixed(5)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {new Intl.DateTimeFormat("en-LK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(report.createdAt))}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-slate-600" title={report.reportId}>
                    {report.reportId.slice(0, 8)}…
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    Your description
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{report.description}</p>
                </div>

                <StatusMessage report={report} />
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-white">{value}</p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 ${color}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  );
}

function StatusMessage({ report }: { report: CitizenReport }) {
  if (report.status === "PENDING_VERIFICATION") {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-amber-200">
        <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
        Your report is waiting for review by a DMC officer.
      </p>
    );
  }

  if (report.status === "VERIFIED") {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs leading-5 text-emerald-200">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
        {report.verificationNotes || "This hazard report has been verified by the DMC."}
      </p>
    );
  }

  return (
    <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs leading-5 text-red-200">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
      <span>
        <strong className="font-bold">Rejected:</strong>{" "}
        {report.verificationNotes || "The DMC could not verify this report."}
      </span>
    </p>
  );
}
