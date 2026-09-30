"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Calendar,
  Layers,
  Check,
  Radio,
  Eye,
  EyeOff,
} from "lucide-react";

export type DispatchStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "REJECTED";

interface DispatchedResourceItem {
  resource: string;
  agency: string;
  quantity: number;
  unit: string;
}

interface TrackingHistoryEntry {
  id: string;
  timestamp: string;
  status: DispatchStatus;
  location: string;
  notes?: string;
}

interface DispatchTrackingData {
  dispatchId: string;
  status: DispatchStatus;
  destination: string;
  responsibleAgency: string;
  responsibleTeam: string;
  eta: string;
  lastUpdated: string;
  resources: DispatchedResourceItem[];
  trackingAvailable: boolean;
  currentLocation?: {
    name: string;
    coordinates: [number, number];
    isLive: boolean;
  };
  lastKnownLocation: {
    name: string;
    coordinates: [number, number];
  };
  history: TrackingHistoryEntry[];
}

const PRESET_DISPATCHES: Record<string, DispatchTrackingData> = {
  "DISP-2026-0042": {
    dispatchId: "DISP-2026-0042",
    status: "IN_TRANSIT",
    destination: "Colombo (Kolonnawa Relief Operations Hub)",
    responsibleAgency: "Sri Lanka Navy & Red Cross Joint Taskforce",
    responsibleTeam: "Rapid Relief Convoy Unit #03",
    eta: "~35 minutes (Today 17:45)",
    lastUpdated: "2 minutes ago (17:10:24)",
    resources: [
      { resource: "Clean Bottled Water", agency: "Government", quantity: 3000, unit: "units" },
      { resource: "Emergency Dry Rations", agency: "NGO — Red Cross", quantity: 1500, unit: "packs" },
      { resource: "First Aid & Medical Kits", agency: "Armed Forces", quantity: 400, unit: "kits" },
    ],
    trackingAvailable: true,
    currentLocation: {
      name: "Peliyagoda Bridge Intersection, Colombo",
      coordinates: [6.9602, 79.8821],
      isLive: true,
    },
    lastKnownLocation: {
      name: "Peliyagoda Bridge Intersection, Colombo",
      coordinates: [6.9602, 79.8821],
    },
    history: [
      {
        id: "hist-1",
        timestamp: "Today at 17:10",
        status: "IN_TRANSIT",
        location: "Peliyagoda Bridge Intersection (Speed: 42 km/h)",
        notes: "Convoy advancing smoothly on Kandy-Colombo road segment.",
      },
      {
        id: "hist-2",
        timestamp: "Today at 16:40",
        status: "IN_TRANSIT",
        location: "Kadawatha Interchange Gateway",
        notes: "Joined Highway transit corridor with police escort.",
      },
      {
        id: "hist-3",
        timestamp: "Today at 16:15",
        status: "DISPATCHED",
        location: "Central Disaster Logistics Depot, Gampaha",
        notes: "Inspection complete. Order sealed and rolling out.",
      },
      {
        id: "hist-4",
        timestamp: "Today at 15:30",
        status: "CONFIRMED",
        location: "DMC Headquarters Operations Room",
        notes: "Multi-agency dispatch plan authorized by coordinator.",
      },
    ],
  },
  "DISP-2026-0039": {
    dispatchId: "DISP-2026-0039",
    status: "DISPATCHED",
    destination: "Kalutara (Millaniya District Center)",
    responsibleAgency: "Armed Forces Logistic Wing",
    responsibleTeam: "Field Battalion Relief Team Bravo",
    eta: "~1 hour 20 minutes (Today 18:30)",
    lastUpdated: "12 minutes ago (17:00:15)",
    resources: [
      { resource: "Clean Bottled Water", agency: "Government", quantity: 2000, unit: "units" },
      { resource: "Ready-to-Eat Meal Packs", agency: "Government", quantity: 1000, unit: "packs" },
    ],
    trackingAvailable: false,
    lastKnownLocation: {
      name: "Depot Loading Dock #2, Panadura",
      coordinates: [6.7134, 79.9074],
    },
    history: [
      {
        id: "hist-21",
        timestamp: "Today at 17:00",
        status: "DISPATCHED",
        location: "Panadura Logistic Hub Checkpoint",
        notes: "Dispatched from warehouse; GPS transponder in standby mode.",
      },
      {
        id: "hist-22",
        timestamp: "Today at 16:00",
        status: "CONFIRMED",
        location: "Western Provincial Coordination Office",
        notes: "Allocation approved for distribution to flood victims.",
      },
    ],
  },
  "DISP-2026-0031": {
    dispatchId: "DISP-2026-0031",
    status: "DELIVERED",
    destination: "Gampaha (Kelaniya Community Shelter)",
    responsibleAgency: "Civil Defence Force & Disaster Response Squad",
    responsibleTeam: "Squadron C-1",
    eta: "Completed",
    lastUpdated: "Delivered at 14:45",
    resources: [
      { resource: "Emergency Dry Rations", agency: "NGO — Red Cross", quantity: 2500, unit: "packs" },
      { resource: "Hygiene & Sanitation Packs", agency: "UNICEF", quantity: 600, unit: "packs" },
    ],
    trackingAvailable: true,
    currentLocation: {
      name: "Kelaniya Community Shelter (Final Destination)",
      coordinates: [6.9554, 79.9189],
      isLive: false,
    },
    lastKnownLocation: {
      name: "Kelaniya Community Shelter Gate #1",
      coordinates: [6.9554, 79.9189],
    },
    history: [
      {
        id: "hist-31",
        timestamp: "Today at 14:45",
        status: "DELIVERED",
        location: "Kelaniya Community Shelter Gate #1",
        notes: "Handed over to shelter coordinator. Beneficiary distribution started.",
      },
      {
        id: "hist-32",
        timestamp: "Today at 14:15",
        status: "IN_TRANSIT",
        location: "Peliyagoda Bypass Avenue",
        notes: "Approaching shelter perimeter.",
      },
      {
        id: "hist-33",
        timestamp: "Today at 13:30",
        status: "DISPATCHED",
        location: "Colombo Central Relief Warehouse",
        notes: "Convoy departed on schedule.",
      },
    ],
  },
};

export default function TrackDispatchPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params?.id as string) || "DISP-2026-0042";

  const initialData: DispatchTrackingData =
    PRESET_DISPATCHES[rawId] || {
      ...PRESET_DISPATCHES["DISP-2026-0042"],
      dispatchId: rawId,
    };

  const [data, setData] = useState<DispatchTrackingData>(initialData);
  const [delivering, setDelivering] = useState(false);
  const [deliveredSuccess, setDeliveredSuccess] = useState(data.status === "DELIVERED");

  const getStatusBadge = (status: DispatchStatus) => {
    switch (status) {
      case "PENDING":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          label: "PENDING",
        };
      case "CONFIRMED":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "CONFIRMED",
        };
      case "DISPATCHED":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          label: "DISPATCHED",
        };
      case "IN_TRANSIT":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "IN_TRANSIT",
        };
      case "DELIVERED":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "DELIVERED",
        };
      case "REJECTED":
        return {
          bg: "bg-red-500/10 text-red-400 border-red-500/20",
          label: "REJECTED",
        };
      default:
        return {
          bg: "bg-slate-800 text-slate-300 border-slate-700",
          label: status,
        };
    }
  };

  const canMarkDelivered =
    (data.status === "DISPATCHED" || data.status === "IN_TRANSIT") && !deliveredSuccess;

  const handleToggleTrackingState = () => {
    setData((prev) => ({
      ...prev,
      trackingAvailable: !prev.trackingAvailable,
    }));
  };

  const handleMarkAsDelivered = async () => {
    if (!canMarkDelivered || delivering) return;
    setDelivering(true);

    try {
      await fetch("/api/relief-resources/dispatch/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatchOrderId: data.dispatchId,
          status: "DELIVERED",
          deliveredAt: new Date().toISOString(),
          finalLocation: data.currentLocation?.name || data.destination,
        }),
      }).catch(() => null);

      const nowString = "Just now (" + new Date().toLocaleTimeString() + ")";
      setData((prev) => ({
        ...prev,
        status: "DELIVERED",
        eta: "Completed",
        lastUpdated: nowString,
        history: [
          {
            id: "hist-del-" + Date.now(),
            timestamp: "Just now",
            status: "DELIVERED",
            location: prev.destination,
            notes: "Delivery confirmed by field officer at affected area.",
          },
          ...prev.history,
        ],
      }));
      setDeliveredSuccess(true);
    } finally {
      setDelivering(false);
    }
  };

  const badgeInfo = getStatusBadge(data.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Breadcrumb, Page Title & Status Pill */}
      <div className="pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Link
              href="/dmc/relief-resources"
              className="hover:text-white transition-colors"
            >
              Relief Resources
            </Link>
            <span>/</span>
            <Link
              href="/dmc/relief-resources"
              className="hover:text-white transition-colors"
            >
              Dispatch
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-semibold">Track</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Track Dispatch — {data.dispatchId}
            </h1>
            <span
              className={"inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border " + badgeInfo.bg}
            >
              {data.status === "IN_TRANSIT" && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping mr-1.5" />
              )}
              {badgeInfo.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time convoy tracking and resource delivery verification for disaster relief.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTrackingState}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Toggle between Live Tracking and Tracking Unavailable modes to test both UI states"
          >
            {data.trackingAvailable ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate GPS Offline</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate GPS Live</span>
              </>
            )}
          </button>

          <Link
            href="/dmc/relief-resources"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dispatches</span>
          </Link>
        </div>
      </div>

      {deliveredSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-sm">Relief Dispatch Successfully Delivered!</div>
            <div className="text-[11px] text-emerald-400/90 font-normal">
              Resources have arrived at {data.destination}. Local requirement fulfillment logged and inventory updated.
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Split: Left Overview Panel & Right Live Tracking Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel — Dispatch overview */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Dispatch overview</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {data.dispatchId}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="py-2 border-b border-slate-800/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Resources dispatched</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {data.resources.length} distinct item(s)
                </span>
              </div>
              <div className="space-y-2 pt-1">
                {data.resources.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">
                          {item.resource}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Agency: {item.agency}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-white text-xs bg-slate-900 px-2 py-1 rounded border border-slate-700">
                      {item.quantity.toLocaleString()} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Responsible agency/team</span>
              <div className="text-right">
                <span className="font-semibold text-slate-200 block flex items-center justify-end gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  {data.responsibleAgency}
                </span>
                <span className="text-[11px] text-slate-400 block font-normal flex items-center justify-end gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  {data.responsibleTeam}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">ETA</span>
              <span className="font-mono font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {data.eta}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Current status</span>
              <span
                className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border " + badgeInfo.bg}
              >
                {data.status}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Last updated timestamp</span>
              <span className="font-mono text-slate-300 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {data.lastUpdated}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Destination / affected area</span>
              <span className="font-semibold text-white text-right max-w-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                {data.destination}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel — Live tracking */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Live tracking</span>
              </h2>

              {data.trackingAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {data.currentLocation?.isLive ? "LIVE GPS" : "LAST KNOWN"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  GPS OFFLINE
                </span>
              )}
            </div>

            {data.trackingAvailable ? (
              <div className="relative w-full h-64 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col justify-between p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-slate-300">
                    GIS: [{data.currentLocation?.coordinates[0].toFixed(4)}, {data.currentLocation?.coordinates[1].toFixed(4)}]
                  </span>
                  <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                    Telemetry Active
                  </span>
                </div>

                <div className="text-center space-y-2 my-auto">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse">
                    <Navigation className="w-7 h-7 text-blue-400 transform rotate-45" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {data.currentLocation?.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Convoy en route to {data.destination}.
                  </p>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>Speed: ~45 km/h</span>
                  <span>Heading: North-East</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-64 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tracking Unavailable</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Live GPS signal is currently not broadcasting from this transport team.
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  Signal search retrying...
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last known location:</span>
                <span className="font-semibold text-slate-200 text-right truncate max-w-[180px]">
                  {data.lastKnownLocation.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last known status:</span>
                <span className="font-semibold text-slate-200">
                  {data.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last update timestamp:</span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {data.lastUpdated}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Tracking history
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of waypoint checkpoints and status updates for this dispatch order.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {data.history.length} checkpoint(s) logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">TIMESTAMP</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6">LOCATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {data.history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 text-xs">
                    No tracking history checkpoints recorded yet for this dispatch order.
                  </td>
                </tr>
              ) : (
                data.history.map((entry) => {
                  const entryBadge = getStatusBadge(entry.status);
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {entry.timestamp}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border " + entryBadge.bg}
                        >
                          {entry.status}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{entry.location}</span>
                        </div>
                        {entry.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5 pl-5">
                            {entry.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => router.push("/dmc/relief-resources")}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleMarkAsDelivered}
            disabled={!canMarkDelivered || delivering}
            className={"inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/20 transition-all " + (
              !canMarkDelivered || delivering
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                : "bg-emerald-600 hover:bg-emerald-500 active:scale-95"
            )}
            title={
              canMarkDelivered
                ? "Confirm that relief convoy reached destination and delivered resources"
                : "Delivery confirmation is only available when status is DISPATCHED or IN_TRANSIT"
            }
          >
            {deliveredSuccess ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Delivered & Verified</span>
              </>
            ) : delivering ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Marking Delivered...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Mark as Delivered</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
