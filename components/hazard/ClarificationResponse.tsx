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
  Send,
} from "lucide-react";

export default function ClarificationResponse({
  reportId,
  requestMessage,
}: {
  reportId: string;
  requestMessage: string;
}) {
  const router =
    useRouter();

  const [
    response,
    setResponse,
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
    if (!response.trim()) {
      setError(
        "Please enter the requested information."
      );

      return;
    }

    setLoading(true);

    setError("");

    try {
      const apiResponse =
        await fetch(
          `/api/hazard-reports/${reportId}/respond-info`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                response:
                  response.trim(),
              }),
          }
        );

      const result =
        await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(
          result.message ||
            "Unable to submit information"
        );
      }

      setResponse("");

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit information"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
      <div className="flex gap-2">
        <MessageCircleQuestion
          className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
          aria-hidden="true"
        />

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
            DMC Officer requested more information
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-100">
            {requestMessage}
          </p>
        </div>
      </div>

      <textarea
        rows={4}
        maxLength={500}
        value={response}
        onChange={(event) =>
          setResponse(
            event.target.value
          )
        }
        placeholder="Provide the requested clarification..."
        className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-blue-500"
      />

      {error && (
        <p className="mt-2 flex gap-2 text-xs text-red-300">
          <AlertCircle
            className="h-4 w-4"
            aria-hidden="true"
          />

          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? (
          <LoaderCircle
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Send
            className="h-4 w-4"
            aria-hidden="true"
          />
        )}

        {loading
          ? "Submitting..."
          : "Submit Additional Information"}
      </button>
    </div>
  );
}