"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import WarningStatusBadge from "@/components/warnings/WarningStatusBadge";
import { ShieldAlert, AlertTriangle, Users, MapPin, CheckCircle2, ArrowLeft, Send, AlertCircle } from "lucide-react";

export default function ReviewWarningPage() {
  const router = useRouter();
  const params = useParams();
  const warningId = params.id as string;

  const [warning, setWarning] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchWarning = async () => {
      try {
        const res = await fetch(`/api/warnings/${warningId}`);
        const data = await res.json();
        if (res.ok) {
          setWarning(data.warning);
        } else {
          setError(data.error || "Warning not found");
        }
      } catch {
        setError("Network error fetching draft warning");
      } finally {
        setLoading(false);
      }
    };
    fetchWarning();
  }, [warningId]);

  const handleConfirmIssue = async () => {
    setIssuing(true);
    setError("");

    try {
      const res = await fetch(`/api/warnings/${warningId}/issue`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        // Exception Flow: Invalid Target Area / No Coverage handling
        setError(data.message || data.error || "Target area validation failed. Adjust boundaries.");
        setIssuing(false);
        setShowConfirmModal(false);
      } else {
        router.push("/dmc/warnings");
      }
    } catch {
      setError("Emergency dispatch request failed.");
      setIssuing(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 text-sm">Loading warning review details...</div>;
  }

  if (!warning) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Warning Draft Not Found</h2>
        <button
          onClick={() => router.push("/dmc/warnings")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            Review & Issue Disaster Warning
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Step 2 of 2: Verify population reach and confirm broadcast alert dispatch.
          </p>
        </div>

        <button
          onClick={() => router.push("/dmc/warnings/new")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Draft</span>
        </button>
      </div>

      {/* Inline Exception Flow Banner (Invalid Target Area Error) */}
      {error && (
        <div className="p-5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-red-400">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>Target Area Validation Failure (Exception Flow)</span>
          </div>
          <p className="text-xs text-red-300 leading-relaxed">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => router.push("/dmc/warnings/new")}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-colors"
            >
              Adjust Map Boundaries
            </button>
          </div>
        </div>
      )}

      {/* Summary Metrics Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">{warning.hazardType} Warning</span>
              <WarningStatusBadge status={warning.severity} type="warning" />
            </div>
            <span className="text-xs text-slate-400 mt-1 block">ID: {warning.warningId}</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Current Status</span>
            <WarningStatusBadge status={warning.status} type="warning" />
          </div>
        </div>

        {/* Reach Metric Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Target District</span>
              <span className="text-base font-bold text-white">{warning.targetArea?.districtName} District</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Calculated Estimated Reach</span>
              <span className="text-base font-black text-amber-400 font-mono">
                {warning.targetArea?.estimatedReach?.toLocaleString()} Citizens
              </span>
            </div>
          </div>
        </div>

        {/* Safety Instructions */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Safety Instructions:</h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed">
            {warning.instructions}
          </div>
        </div>

        {/* Time Validity */}
        <div className="text-xs text-slate-400 flex items-center justify-between pt-2">
          <span>Valid From: <strong className="text-slate-200">{new Date(warning.validFrom).toLocaleString()}</strong></span>
          <span>Valid Until: <strong className="text-slate-200">{new Date(warning.validUntil).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Confirm Action Button */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => router.push("/dmc/warnings")}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
        >
          Cancel & Save as Draft
        </button>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-600/30"
        >
          <Send className="w-4 h-4" />
          <span>Confirm & Issue Emergency Alert</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Alert Dispatch</h3>
                <p className="text-xs text-slate-400">Broadcast notification warning to citizens</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              Are you sure you want to issue this <strong>{warning.severity} Severity {warning.hazardType} Warning</strong> to{" "}
              <strong>{warning.targetArea?.districtName} District</strong> (Estimated Reach: {warning.targetArea?.estimatedReach?.toLocaleString()} citizens)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={issuing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIssue}
                disabled={issuing}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-red-600/30 disabled:opacity-50"
              >
                {issuing ? (
                  <span>Dispatching Alerts...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Issue Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
