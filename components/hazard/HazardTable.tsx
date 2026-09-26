import Link from "next/link";
import { ArrowRight, Inbox, MapPin, TriangleAlert } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface HazardReportRow {
  reportId: string;
  hazardType: string;
  locationName: string;
  status: string;
  createdAt: string;
}

export default function HazardTable({
  reports,
  title = "Citizen reports",
  subtitle = "Newest submissions appear first",
}: {
  reports: HazardReportRow[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-bold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
          {reports.length} {reports.length === 1 ? "report" : "reports"}
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <Inbox className="h-7 w-7" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-base font-bold text-white">No reports in this section</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
            Citizen submissions will appear here when they are received.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-950/60">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Report</th>
                <th className="px-6 py-3.5">Hazard</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Submitted</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports.map((report) => (
                <tr key={report.reportId} className="group transition hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <span className="block max-w-32 truncate font-mono text-xs text-slate-400" title={report.reportId}>
                      {report.reportId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                      <TriangleAlert className="h-4 w-4 text-red-400" aria-hidden="true" />
                      {report.hazardType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      {report.locationName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Intl.DateTimeFormat("en-LK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(report.createdAt))}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dmc/hazard-reports/${report.reportId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 transition hover:border-red-500/40 hover:bg-red-500 hover:text-white"
                    >
                      Review
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
