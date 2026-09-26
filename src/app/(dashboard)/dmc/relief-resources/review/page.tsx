"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Droplet,
  Package,
  Activity,
  Boxes,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  ShieldAlert,
  Save,
  Check,
  Building2,
} from "lucide-react";

function ReviewConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL State parameters or defaults from Wireframe
  const resourceName = searchParams.get("name") || "Water";
  const owner = searchParams.get("owner") || "Government";
  const destination = searchParams.get("district") || "Colombo";
  const agency = searchParams.get("agency") || "Navy Special Boat Squadron #1";
  const eta = searchParams.get("eta") || "2 Hours (Today 18:00)";
  const quantity = Number(searchParams.get("quantity")) || 1500;
  const currentStock = Number(searchParams.get("stock")) || 5000;
  const remainingStock = Number(searchParams.get("remaining")) || Math.max(0, currentStock - quantity);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getResourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("water")) return <Droplet className="w-4 h-4 text-blue-400" />;
    if (lower.includes("food") || lower.includes("ration")) return <Package className="w-4 h-4 text-amber-400" />;
    if (lower.includes("med") || lower.includes("health")) return <Activity className="w-4 h-4 text-red-400" />;
    return <Boxes className="w-4 h-4 text-slate-400" />;
  };

  const handleConfirmDistribution = async () => {
    setSubmitting(true);
    setErrorMessage("");

    try {
      // Call existing API endpoint to log distribution & update inventory stock
      const res = await fetch("/api/relief-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: "RES-WATER-01",
          quantity: quantity,
          district: destination,
          centerName: `${destination} Central Relief Operations Center`,
          beneficiariesCount: Math.round(quantity * 0.8),
          notes: `Multi-agency dispatch assigned to ${agency}. ETA: ${eta}. Status: PENDING.`,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dmc/relief-resources");
        }, 1500);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to confirm distribution order.");
      }
    } catch {
      setErrorMessage("Network error connecting to DMC relief API.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    alert("Distribution saved as DRAFT order.");
    router.push("/dmc/relief-resources");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Link href="/dmc/relief-resources" className="hover:text-white transition-colors">
              Relief Resources
            </Link>
            <span>/</span>
            <span>Distribute</span>
            <span>/</span>
            <span className="text-slate-200 font-semibold">Review</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Review & Confirm Relief Distribution
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verify all distribution details before confirming.
          </p>
        </div>

        <Link
          href={`/dmc/relief-resources/create?name=${encodeURIComponent(resourceName)}&stock=${currentStock}&owner=${encodeURIComponent(owner)}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Edit</span>
        </Link>
      </div>

      {/* Success Notification Banner */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div>Distribution & Dispatch Order Confirmed Successfully!</div>
            <div className="text-[11px] text-emerald-400 font-normal">
              Dispatch status set to PENDING. Stock deducted and inventory updated. Redirecting...
            </div>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Review overview Panel (3/5 width ~60%) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="pb-3 border-b border-slate-800/80">
            <h2 className="text-base font-bold text-white">Review overview</h2>
          </div>

          {/* Key-Value Pair Listing */}
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Resource</span>
              <span className="font-bold text-white flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center">
                  {getResourceIcon(resourceName)}
                </div>
                {resourceName}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Owner</span>
              <span className="font-medium text-slate-200">{owner}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Destination</span>
              <span className="font-semibold text-slate-200">{destination}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Quantity</span>
              <span className="font-extrabold text-white font-mono text-sm">{quantity.toLocaleString()} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Current stock</span>
              <span className="font-mono text-slate-300">{currentStock.toLocaleString()} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Remaining stock</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{remainingStock.toLocaleString()} units</span>
            </div>

            {/* EXTENSION FIELDS FOR BROADENED USE CASE */}
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Agencies involved</span>
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                DMC, Sri Lanka Navy, Red Cross
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Responsible team</span>
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                {agency}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">ETA</span>
              <span className="font-mono text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {eta}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Dispatch status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PENDING
              </span>
            </div>
          </div>

          {/* DISTRIBUTION NOTES */}
          <div className="pt-2 space-y-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              DISTRIBUTION NOTES
            </span>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li>Confirm the receiving shelter acknowledges delivery on arrival.</li>
              <li>Update local inventory once supplies reach {destination}.</li>
              <li>Report any shortfall to the district coordinator immediately.</li>
            </ul>
          </div>

          {/* Green Callout Banner Box */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider block font-bold">
                ESTIMATED BENEFICIARIES COVERED
              </span>
              <span className="text-sm font-extrabold text-white">
                ~{Math.round(quantity * 0.8).toLocaleString()} households in {destination} district
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Destination overview Map Panel (2/5 width ~40%) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-sm font-bold text-white truncate max-w-[180px]">
                {destination} district — destination overview
              </h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                DESTINATION CONFIRMED
              </span>
            </div>

            {/* Visual Leaflet Style Map Viewport */}
            <div className="relative w-full h-64 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col items-center justify-center">
              <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    Target GIS: [6.9271, 79.8612]
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    Zone Verified
                  </span>
                </div>

                <div className="my-auto text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {destination} Relief Zone
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Destination confirmed for convoy delivery via {agency}.
                  </p>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span># {destination} City</span>
                  <div className="flex gap-1">
                    <button type="button" className="w-5 h-5 bg-slate-800 border border-slate-700 text-white rounded font-bold flex items-center justify-center">+</button>
                    <button type="button" className="w-5 h-5 bg-slate-800 border border-slate-700 text-white rounded font-bold flex items-center justify-center">-</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <Link
          href={`/dmc/relief-resources/create?name=${encodeURIComponent(resourceName)}&stock=${currentStock}&owner=${encodeURIComponent(owner)}`}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          Back
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as draft</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmDistribution}
            disabled={submitting || success}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/20 transition-all ${
              submitting || success
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 active:scale-95"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? "Processing Dispatch..." : "Confirm distribution"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewConfirmPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading review...</div>}>
      <ReviewConfirmContent />
    </Suspense>
  );
}
