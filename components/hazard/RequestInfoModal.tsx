"use client";

import {
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  AlertCircle,
  LoaderCircle,
  MessageCircleQuestion,
  X,
} from "lucide-react";

export default function RequestInfoModal({
  reportId,
  close,
}: {
  reportId: string;
  close: () => void;
}) {
  const router =
    useRouter();

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function submit() {
    if (
      !message.trim()
    ) {
      setError(
        "Please describe the additional information required."
      );

      return;
    }

    setLoading(true);

    setError("");

    try {
      const response =
        await fetch(
          `/api/hazard-reports/${reportId}/request-info`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                message:
                  message.trim(),
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to request additional information"
        );
      }

      close();

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request additional information"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 p-5">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <MessageCircleQuestion
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <div>
              <h2 className="font-bold text-white">
                Request Additional Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Ask the citizen for clarification before making a final decision.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="p-5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Information Required
          </label>

          <textarea
            rows={5}
            maxLength={500}
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            placeholder="Example: Please confirm whether the road is completely blocked and provide the nearest landmark."
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-blue-500"
          />

          <div className="mt-1 text-right text-xs text-slate-600">
            {message.length}/500
          </div>

          {error && (
            <p className="mt-3 flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 p-5">
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading && (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}

            {loading
              ? "Sending..."
              : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}