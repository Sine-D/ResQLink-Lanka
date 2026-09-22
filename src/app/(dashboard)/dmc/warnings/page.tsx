"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import WarningStatusBadge from "@/components/warnings/WarningStatusBadge";
import { PlusCircle, RefreshCw, AlertCircle, ShieldAlert, Radio, Eye } from "lucide-react";

export default function ActiveWarningsDashboard() {
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/warnings?mode=all");
      const data = await res.json();
      setWarnings(data.warnings || []);
    } catch {
      console.error("Failed to fetch warnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const handleRetryDispatch = async (warningId: string) => {
    setRetryingId(warningId);
    try {
      const res = await fetch(`/api/warnings/${warningId}/retry-dispatch`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchWarnings();
      } else {
        alert("Retry dispatch failed");
      }
    } catch {
      alert("Error triggering retry dispatch");
    } finally {
      setRetryingId(null);
    }
  };

  const filteredWarnings = warnings.filter((w) => {
    if (filterStatus === "ACTIVE") return w.status === "ACTIVE";
    if (filterStatus === "DRAFT") return w.status === "DRAFT";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            Disaster Early-Warning Command Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Member 1 Module: Monitor active location-based emergency broadcasts and delivery statuses
          </p>
        </div>

        <Link
          href="/dmc/warnings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Issue New Warning</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filter Status:</span>
          {(["ALL", "ACTIVE", "DRAFT"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === st
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={fetchWarnings}
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Warnings Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading active disaster warnings...
        </div>
      ) : filteredWarnings.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Disaster Warnings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Issue New Warning&quot; to create a location-based disaster alert.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Hazard & Severity</th>
                  <th className="py-3.5 px-4">Target District</th>
                  <th className="py-3.5 px-4">Est. Population Reach</th>
                  <th className="py-3.5 px-4">Warning Status</th>
                  <th className="py-3.5 px-4">Broadcast Delivery</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredWarnings.map((warning) => {
                  const needsRetry =
                    warning.dispatchStatus === "PENDING_DISPATCH" ||
                    warning.dispatchStatus === "FAILED";

                  return (
                    <tr key={warning.warningId} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{warning.hazardType}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Valid: {new Date(warning.validFrom).toLocaleDateString()} - {new Date(warning.validUntil).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-300">
                        {warning.targetArea?.districtName}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-amber-400">
                        {warning.targetArea?.estimatedReach?.toLocaleString() || "N/A"}
                      </td>

                      <td className="py-4 px-4">
                        <WarningStatusBadge status={warning.status} type="warning" />
                      </td>

                      <td className="py-4 px-4">
                        <WarningStatusBadge status={warning.dispatchStatus} type="dispatch" />
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {/* Retry Dispatch Action - Visible ONLY when PENDING_DISPATCH or FAILED */}
                        {needsRetry && (
                          <button
                            onClick={() => handleRetryDispatch(warning.warningId)}
                            disabled={retryingId === warning.warningId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white font-bold text-[11px] transition-all"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${retryingId === warning.warningId ? "animate-spin" : ""}`} />
                            <span>Retry Dispatch</span>
                          </button>
                        )}

                        {warning.status === "DRAFT" ? (
                          <Link
                            href={`/dmc/warnings/${warning.warningId}/review`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all"
                          >
                            <span>Review & Issue</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/dmc/warnings/${warning.warningId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
