"use client";

import {
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageCircleQuestion,
  XCircle,
} from "lucide-react";

import RejectModal from "./RejectModal";

import RequestInfoModal from "./RequestInfoModal";

export default function ReviewActions({
  reportId,
  status,
}: {
  reportId: string;
  status: string;
}) {
  const router =
    useRouter();

  const [
    showReject,
    setShowReject,
  ] = useState(false);

  const [
    showRequestInfo,
    setShowRequestInfo,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const isPending =
    status ===
    "PENDING_VERIFICATION";

  if (
    status ===
    "MORE_INFO_REQUIRED"
  ) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4 text-sm text-blue-200">
        <Clock3
          className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
          aria-hidden="true"
        />

        <div>
          <p className="font-bold">
            Waiting for citizen response
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-200/70">
            The officer requested additional information. A final verification decision can be made after the citizen responds.
          </p>
        </div>
      </div>
    );
  }

  async function verify() {
    setLoading(true);

    setError("");

    try {
      const response =
        await fetch(
          `/api/hazard-reports/${reportId}/verify`,
          {
            method: "PUT",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Verification failed"
        );
      }

      router.refresh();
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isPending) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        <CheckCircle2
          className="h-4 w-4 text-emerald-400"
          aria-hidden="true"
        />

        This report has already been reviewed. No further action is required.
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 pt-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">
            Verification decision
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Verify, reject, or request additional information from the citizen.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              setShowReject(true)
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 hover:bg-red-500 hover:text-white"
          >
            <XCircle
              className="h-4 w-4"
              aria-hidden="true"
            />

            Reject
          </button>

          <button
            type="button"
            onClick={() =>
              setShowRequestInfo(true)
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-bold text-blue-300 hover:bg-blue-500 hover:text-white"
          >
            <MessageCircleQuestion
              className="h-4 w-4"
              aria-hidden="true"
            />

            Request More Information
          </button>

          <button
            type="button"
            onClick={verify}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500"
          >
            {loading ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                className="h-4 w-4"
                aria-hidden="true"
              />
            )}

            {loading
              ? "Verifying..."
              : "Verify Report"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle
            className="h-4 w-4"
            aria-hidden="true"
          />

          {error}
        </p>
      )}

      {showReject && (
        <RejectModal
          reportId={reportId}
          close={() =>
            setShowReject(false)
          }
        />
      )}

      {showRequestInfo && (
        <RequestInfoModal
          reportId={reportId}
          close={() =>
            setShowRequestInfo(false)
          }
        />
      )}
    </div>
  );
}