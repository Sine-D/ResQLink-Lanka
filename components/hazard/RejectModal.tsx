"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LoaderCircle, X, XCircle } from "lucide-react";
import styles from "./RejectModal.module.css";

interface RejectModalProps {
  reportId: string;
  close: () => void;
}

export default function RejectModal({ reportId, close }: RejectModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason.trim()) {
      setError("Please enter a reason for rejecting this report.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/hazard-reports/${reportId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Rejection failed");

      close();
      router.refresh();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Rejection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-title"
    >
      <form
        onSubmit={reject}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="reject-title" className="text-lg font-bold text-white">Reject hazard report</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">Add a clear reason for the audit record.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close rejection dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <label htmlFor="rejection-reason" className="mb-2 block text-sm font-semibold text-slate-200">
            Rejection reason <span className="text-red-400">*</span>
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            className={`${styles.textarea} min-h-32 w-full resize-y rounded-xl border border-slate-700 px-4 py-3 text-sm leading-6 outline-none transition hover:border-slate-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10`}
            maxLength={500}
            placeholder="Explain why this report could not be verified..."
            autoFocus
          />
          <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
            <span>This note will be stored with the report.</span>
            <span>{reason.length}/500</span>
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-950/40 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
            {loading ? "Rejecting..." : "Confirm rejection"}
          </button>
        </div>
      </form>
    </div>
  );
}
