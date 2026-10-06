"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import RejectModal from "./RejectModal";

export default function ReviewActions({ reportId, status }: { reportId: string; status: string }) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isPending = status === "PENDING_VERIFICATION";

  async function verify() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/hazard-reports/${reportId}/verify`, { method: "PUT" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Verification failed");

      router.refresh();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isPending) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        This report has already been reviewed. No further action is required.
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Verification decision</h2>
          <p className="mt-1 text-xs text-slate-500">Confirm the evidence before changing this report&apos;s status.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Reject report
          </button>
          <button
            type="button"
            onClick={verify}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            {loading ? "Verifying..." : "Verify report"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {showReject && <RejectModal reportId={reportId} close={() => setShowReject(false)} />}
    </div>
  );
}
