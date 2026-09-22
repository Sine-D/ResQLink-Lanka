"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import WarningStatusBadge from "@/components/warnings/WarningStatusBadge";
import { Radio, ArrowLeft, RefreshCw, MapPin, Users, AlertCircle, Clock } from "lucide-react";

export default function WarningDetailPage() {
  const router = useRouter();
  const params = useParams();
  const warningId = params.id as string;

  const [warning, setWarning] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/warnings/${warningId}`);
      const data = await res.json();
      if (res.ok) {
        setWarning(data.warning);
      }
    } catch {
      console.error("Failed to load warning detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [warningId]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/warnings/${warningId}/retry-dispatch`, { method: "POST" });
      if (res.ok) {
        await fetchDetail();
      } else {
        alert("Retry dispatch failed");
      }
    } catch {
      alert("Error executing retry dispatch");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500 text-sm">Loading warning record...</div>;
  if (!warning) return <div className="py-20 text-center text-red-400 text-sm">Warning record not found.</div>;

  const needsRetry = warning.dispatchStatus === "PENDING_DISPATCH" || warning.dispatchStatus === "FAILED";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => router.push("/dmc/warnings")}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {needsRetry && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white font-bold text-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
              <span>Retry Dispatch</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-red-500" />
              {warning.hazardType} Warning
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">UUID: {warning.warningId}</p>
          </div>

          <div className="flex items-center gap-2">
            <WarningStatusBadge status={warning.status} type="warning" />
            <WarningStatusBadge status={warning.dispatchStatus} type="dispatch" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block">District Scope</span>
            <span className="text-base font-bold text-white flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-red-400" />
              {warning.targetArea?.districtName}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block">Est. Population Reach</span>
            <span className="text-base font-black text-amber-400 font-mono flex items-center gap-1 mt-1">
              <Users className="w-4 h-4" />
              {warning.targetArea?.estimatedReach?.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block">Issued By</span>
            <span className="text-sm font-semibold text-white mt-1 block">
              {warning.issuedBy?.name || "DMC Officer"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-400">Emergency Instructions:</h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed">
            {warning.instructions}
          </div>
        </div>
      </div>
    </div>
  );
}
