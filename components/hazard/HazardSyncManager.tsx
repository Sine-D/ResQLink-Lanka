"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudUpload, XCircle } from "lucide-react";
import { synchronizeQueuedHazardReports } from "@/lib/offline/hazardReportQueue";

export default function HazardSyncManager() {
  const router = useRouter();
  const syncing = useRef(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const synchronize = useCallback(async () => {
    if (syncing.current || !navigator.onLine) return;

    syncing.current = true;
    try {
      const result = await synchronizeQueuedHazardReports();
      if (result.synchronized > 0) {
        setNotice({
          type: "success",
          message: `${result.synchronized} offline hazard ${result.synchronized === 1 ? "report" : "reports"} synchronized.`,
        });
        router.refresh();
      } else if (result.failed > 0) {
        setNotice({ type: "error", message: "Offline reports could not be synchronized. They will be retried." });
      }
    } catch {
      setNotice({ type: "error", message: "Offline report synchronization failed. It will retry automatically." });
    } finally {
      syncing.current = false;
    }
  }, [router]);

  useEffect(() => {
    const initialSync = window.setTimeout(() => void synchronize(), 0);
    window.addEventListener("online", synchronize);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("online", synchronize);
    };
  }, [synchronize]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl ${
        notice.type === "success"
          ? "border-emerald-500/20 bg-emerald-950 text-emerald-200"
          : "border-red-500/20 bg-red-950 text-red-200"
      }`}
    >
      {notice.type === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{notice.message}</span>
      <CloudUpload className="mt-0.5 h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
    </div>
  );
}
