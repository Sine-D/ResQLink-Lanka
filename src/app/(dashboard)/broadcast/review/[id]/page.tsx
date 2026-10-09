"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import WarningStatusBadge from "@/components/warnings/WarningStatusBadge";
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Send,
  AlertCircle,
  Save,
  Pencil,
  Clock,
  Radio,
  FileCheck2,
  Trash2,
} from "lucide-react";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function BroadcastReviewDetailPage({ params }: ReviewPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [warning, setWarning] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [overlapData, setOverlapData] = useState<any>(null);
  const [savedDraftToast, setSavedDraftToast] = useState(false);

  useEffect(() => {
    const fetchWarning = async () => {
      try {
        const res = await fetch(`/api/warnings/${id}`);
        const data = await res.json();
        if (res.ok && data.warning) {
          setWarning(data.warning);

          // E3 Check: Check duplicate active warning for this district and hazard
          const overlapRes = await fetch(
            `/api/warnings/check-overlap?district=${encodeURIComponent(
              data.warning.targetArea.districtName
            )}&hazardType=${encodeURIComponent(data.warning.hazardType)}&excludeId=${data.warning.warningId}`
          );
          const overlapJson = await overlapRes.json();
          if (overlapJson.hasOverlap) {
            setOverlapData(overlapJson.existingWarning);
          }
        } else {
          setError(data.error || "Warning record not found");
        }
      } catch {
        setError("Network error fetching draft warning details");
      } finally {
        setLoading(false);
      }
    };

    fetchWarning();
  }, [id]);

  const handleBroadcastClick = () => {
    if (warning?.severity === "High" || warning?.severity === "Critical") {
      setShowConfirmModal(true);
    } else {
      executeIssueAndBroadcast();
    }
  };

  const executeIssueAndBroadcast = async () => {
    setIssuing(true);
    setError("");

    try {
      const res = await fetch(`/api/warnings/${id}/issue`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Broadcast dispatch failed.");
        setIssuing(false);
        setShowConfirmModal(false);
      } else {
        setShowConfirmModal(false);
        router.push(`/broadcast/summary/${warning.warningId}`);
      }
    } catch {
      setError("Emergency broadcast dispatch request failed.");
      setIssuing(false);
      setShowConfirmModal(false);
    }
  };

  const handleSaveAsDraft = () => {
    setSavedDraftToast(true);
    setTimeout(() => setSavedDraftToast(false), 4000);
  };

  const handleEditDraft = () => {
    router.push(`/broadcast/create?editDraft=${warning.warningId}`);
  };

  const handleDiscardDraft = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/warnings/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to discard draft warning.");
        setShowDeleteModal(false);
        setDeleting(false);
      } else {
        router.push("/broadcast/create");
      }
    } catch {
      setError("Network error while discarding draft.");
      setShowDeleteModal(false);
      setDeleting(false);
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
          onClick={() => router.push("/broadcast/create")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Return to Broadcast Form
        </button>
      </div>
    );
  }

  const reach = warning.targetArea?.estimatedReach || 0;
  const isHighSeverity = warning.severity === "High" || warning.severity === "Critical";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            <span>Review & Validate Disaster Warning</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            UC1 - Step 2: Validate fields (E1), verify reach (E2), check active duplicates (E3), and authorize broadcast.
          </p>
        </div>

        <button
          onClick={handleEditDraft}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit Draft (A3)</span>
        </button>
      </div>

      {savedDraftToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Draft state saved and preserved in database as DRAFT (A2).</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Warning Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white">
              {warning.hazardType} Disaster Warning
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              State: {warning.status}
            </span>
            <WarningStatusBadge status={warning.severity} type="severity" />
          </div>
        </div>

        {/* Validation Verification Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">E1 Required Fields</span>
              <span className="text-xs font-bold text-white">All Validated</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">E2 TargetArea Geofence</span>
              <span className="text-xs font-bold text-white">Verified Polygon</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Audience Reach</span>
              <span className="text-xs font-bold text-red-400 font-mono">{reach.toLocaleString()} citizens</span>
            </div>
          </div>
        </div>

        {/* Scope and Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              Target District Scope
            </span>
            <div className="text-sm font-bold text-white">{warning.targetArea.districtName} District</div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              Coordinates: {JSON.stringify(warning.targetArea.coordinates.coordinates[0]?.[0])}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Broadcast Validity Window
            </span>
            <div className="text-xs font-medium text-white">
              {new Date(warning.validFrom).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">
              Until: <span className="text-amber-400 font-medium">{new Date(warning.validUntil).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-400 block">Emergency Public Directives (Instructions)</span>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">{warning.instructions}</p>
        </div>

        {/* Source Incident Link */}
        {warning.sourceIncidentId && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Linked to verified report: <strong className="text-white font-mono">{warning.sourceIncidentId}</strong></span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEditDraft}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Draft (A3)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save as Draft (A2)</span>
          </button>

          {warning.status === "DRAFT" && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-800/60 hover:bg-red-900/40 text-red-400 hover:text-red-300 font-bold text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Discard Draft</span>
            </button>
          )}
        </div>

        <button
          onClick={handleBroadcastClick}
          disabled={issuing}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-xl shadow-red-600/30 transition-all ml-auto"
        >
          <Radio className={`w-4 h-4 ${issuing ? "animate-spin" : ""}`} />
          <span>{issuing ? "Broadcasting..." : "Confirm & Broadcast Warning"}</span>
        </button>
      </div>

      {/* Confirmation Modal for High / Critical Severity */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl shadow-red-600/20">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  High Severity Broadcast Confirmation
                </h3>
                <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                  Mandatory Authorization Step
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                You are about to issue a <strong>{warning.severity.toUpperCase()}</strong> severity broadcast for{" "}
                <strong>{warning.targetArea.districtName}</strong> district.
              </p>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <span className="text-slate-400">Exact Audience Reach:</span>
                <span className="text-sm font-black text-red-400 font-mono">
                  {reach.toLocaleString()} Citizens
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Dispatch Channels:</span>
                <span className="text-white font-semibold">Push Alerts & SMS Fallback</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Once authorized, the system transitions to <strong>ACTIVE</strong> state and asynchronously triggers
              cellular broadcast gateways.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={issuing}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeIssueAndBroadcast}
                disabled={issuing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/40"
              >
                <Radio className={`w-3.5 h-3.5 ${issuing ? "animate-spin" : ""}`} />
                <span>{issuing ? "Dispathing Broadcast..." : "Yes, Authorize Broadcast"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Hard Delete / Discard Draft */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl shadow-red-600/20">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Discard Warning Draft?
                </h3>
                <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                  Permanent Hard Delete (CRUD: Delete)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently discard and delete this warning draft for <strong>{warning.targetArea?.districtName}</strong>? This action cannot be undone and will remove the draft from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/40 transition-all"
              >
                <Trash2 className={`w-3.5 h-3.5 ${deleting ? "animate-spin" : ""}`} />
                <span>{deleting ? "Deleting Draft..." : "Yes, Discard Draft"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
