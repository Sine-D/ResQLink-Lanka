"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import WarningStatusBadge from "@/components/warnings/WarningStatusBadge";
import {
  Radio,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";

interface SummaryPageProps {
  params: Promise<{ id: string }>;
}

export default function DeliverySummaryDashboardPage({ params }: SummaryPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const [alarmPlaying, setAlarmPlaying] = useState(false);

  useEffect(() => {
    // Check if emergency siren audio is playing or should be auto-played
    if (typeof window !== "undefined") {
      const audio = (window as any).__warningAlarmAudio;
      if (audio && !audio.paused) {
        setAlarmPlaying(true);
      } else if (new URLSearchParams(window.location.search).get("alarm") === "true") {
        try {
          const newAudio = audio || new Audio("/warning_alarm.mp3");
          newAudio.volume = 1.0;
          newAudio.loop = true;
          (window as any).__warningAlarmAudio = newAudio;
          newAudio
            .play()
            .then(() => setAlarmPlaying(true))
            .catch(() => {});
        } catch {}
      }
    }
  }, []);

  const toggleAlarmAudio = () => {
    if (typeof window !== "undefined") {
      let audio = (window as any).__warningAlarmAudio;
      if (!audio) {
        audio = new Audio("/warning_alarm.mp3");
        audio.volume = 1.0;
        audio.loop = true;
        (window as any).__warningAlarmAudio = audio;
      }

      if (alarmPlaying) {
        audio.pause();
        setAlarmPlaying(false);
      } else {
        audio.play().then(() => setAlarmPlaying(true)).catch(() => {});
      }
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/warnings/${id}/summary`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch {
      console.error("Failed to load delivery summary stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Real-time polling every 5 seconds for live stats updates and auto-expiration
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleRetryDispatch = async () => {
    setRetrying(true);
    setRetryMessage("");
    try {
      const res = await fetch(`/api/warnings/${id}/retry-dispatch`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setRetryMessage("Retry dispatch triggered successfully. Updated metrics retrieved.");
        await fetchSummary();
      } else {
        setRetryMessage(json.error || "Retry dispatch failed.");
      }
    } catch {
      setRetryMessage("Network error during retry execution.");
    } finally {
      setRetrying(false);
      setTimeout(() => setRetryMessage(""), 5000);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 text-sm">Loading delivery summary...</div>;
  }

  if (!data || !data.warning) {
    return (
      <div className="py-20 text-center text-red-400 text-sm space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <p>Delivery summary record not found.</p>
        <button
          onClick={() => router.push("/dmc/warnings")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Return to Warnings
        </button>
      </div>
    );
  }

  const { warning, summary } = data;
  const isExpired = warning.status === "EXPIRED" || new Date(warning.validUntil) <= new Date();
  const needsRetry =
    summary?.dispatchStatus === "PENDING_DISPATCH" ||
    summary?.dispatchStatus === "FAILED" ||
    summary?.failedCount > 0 ||
    summary?.pendingCount > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <button
            onClick={() => router.push("/dmc/warnings")}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Warnings Dashboard</span>
          </button>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <span>Delivery Summary Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Broadcast ID: {warning.warningId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/broadcast/create")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Warning</span>
          </button>

          {needsRetry && (
            <button
              onClick={handleRetryDispatch}
              disabled={retrying}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/30 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
              <span>{retrying ? "Retrying Dispatch..." : "Retry Failed Dispatch"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Retry Message Alert */}
      {retryMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{retryMessage}</span>
        </div>
      )}

      {/* Auto-Expiration Banner */}
      {isExpired && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Warning Automatically Expired: End Time ({new Date(warning.validUntil).toLocaleString()}) has been reached.</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black shrink-0">
            EXPIRED
          </span>
        </div>
      )}

      {/* Emergency Siren Audio Player Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              alarmPlaying
                ? "bg-red-600/30 border border-red-500/60 text-red-400 animate-pulse"
                : "bg-slate-800 border border-slate-700 text-slate-400"
            }`}
          >
            <Radio className={`w-5 h-5 ${alarmPlaying ? "animate-spin" : ""}`} />
          </div>
          <div>
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Public Broadcast Siren Sound</span>
              {alarmPlaying ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-mono animate-pulse">
                  PLAYING
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  MUTED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {alarmPlaying
                ? "Real emergency alarm is actively sounding through device speaker."
                : "Siren audio is muted. Click button to test or replay emergency siren."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAlarmAudio}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
            alarmPlaying
              ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
        >
          <span>{alarmPlaying ? "🔇 Silence Siren" : "🔊 Play Siren Audio"}</span>
        </button>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Sent</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary.sentCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Transmitted to gateway</span>
        </div>

        {/* Delivered */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 bg-gradient-to-b from-emerald-950/10 to-slate-900 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span>Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {summary.deliveredCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-500/80">Confirmed cell devices</span>
        </div>

        {/* Pending */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {summary.pendingCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Awaiting gateway queue</span>
        </div>

        {/* Failed */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-red-500/30 space-y-1">
          <div className="flex items-center justify-between text-red-400 text-xs">
            <span>Failed</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            {summary.failedCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">
            {summary.retryCount > 0 ? `Retried ${summary.retryCount}x` : "Failed dispatches"}
          </span>
        </div>
      </div>

      {/* Broadcast Metadata & TargetArea Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>{warning.hazardType} Warning</span>
            </h2>
            <span className="text-xs text-slate-400">
              Target District: <strong className="text-white">{warning.targetArea.districtName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <WarningStatusBadge status={warning.status} type="warning" />
            <WarningStatusBadge status={warning.severity} type="severity" />
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono">
              Channel: {summary.channel}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-red-400" />
              Audience Reach Headcount
            </span>
            <span className="text-lg font-black text-red-400 font-mono">
              {summary.totalTargetReach.toLocaleString()} Citizens
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Broadcast Validity
            </span>
            <span className="text-xs font-semibold text-white block">
              From: {new Date(warning.validFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-xs text-slate-400 block">
              Until: {new Date(warning.validUntil).toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              GIS Geofence Status
            </span>
            <span className="text-xs font-semibold text-emerald-400 block">
              5 Coordinate Polygon Active
            </span>
            <span className="text-[10px] text-slate-500 font-mono truncate block">
              Ring: {JSON.stringify(warning.targetArea.coordinates.coordinates[0]?.[0])}
            </span>
          </div>
        </div>

        {/* Safety Directives */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-400 font-semibold block">Dispatched Safety Instructions</span>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">{warning.instructions}</p>
        </div>
      </div>
    </div>
  );
}
