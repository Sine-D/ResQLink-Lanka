"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import {
  getQueuedHazardReports,
  HAZARD_QUEUE_CHANGED_EVENT,
  QueuedHazardReport,
  synchronizeQueuedHazardReports,
} from "@/lib/offline/hazardReportQueue";

export default function PendingSyncReports() {
  const router = useRouter();
  const [reports, setReports] = useState<QueuedHazardReport[]>([]);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [syncing, setSyncing] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      setReports(await getQueuedHazardReports());
    } catch {
      setReports([]);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadQueue(), 0);

    const handleOnline = () => {
      setOnline(true);
      void loadQueue();
    };
    const handleOffline = () => setOnline(false);
    const handleQueueChange = () => void loadQueue();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(HAZARD_QUEUE_CHANGED_EVENT, handleQueueChange);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(HAZARD_QUEUE_CHANGED_EVENT, handleQueueChange);
    };
  }, [loadQueue]);

  async function retrySynchronization() {
    setSyncing(true);
    try {
      const result = await synchronizeQueuedHazardReports();
      await loadQueue();
      if (result.synchronized > 0) router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  if (reports.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-500/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/10 px-5 py-4 sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-amber-100">
            <CloudOff className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Pending synchronization
          </h2>
          <p className="mt-1 text-xs text-amber-200/60">
            Stored safely on this device until a network connection is available.
          </p>
        </div>
        <button
          type="button"
          onClick={retrySynchronization}
          disabled={!online || syncing}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {online ? (syncing ? "Synchronizing..." : "Retry now") : "Waiting for network"}
        </button>
      </div>

      <div className="divide-y divide-amber-500/10">
        {reports.map((report) => (
          <article key={report.clientReportId} className="px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{report.hazardType}</h3>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Pending synchronization
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {report.coordinates.latitude.toFixed(5)}, {report.coordinates.longitude.toFixed(5)}
                </p>
              </div>
              <div className="text-left text-xs text-slate-500 sm:text-right">
                <p>{new Date(report.queuedAt).toLocaleString("en-LK")}</p>
                {report.lastError && <p className="mt-1 max-w-xs text-red-300">{report.lastError}</p>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
