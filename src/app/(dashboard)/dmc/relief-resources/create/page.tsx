"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Droplet,
  Package,
  Activity,
  Boxes,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Clock,
  Truck,
  Building2,
  AlertTriangle,
} from "lucide-react";

interface AgencyStockItem {
  agency: string;
  resourceId: string;
  available: number;
  allocated: number;
}

interface RawResourceItem {
  name: string;
  quantity: number;
}

function CreateDistributionFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected resource details from URL query or defaults
  const resourceName = searchParams.get("name") || "Water";
  const initialStock = Number(searchParams.get("stock")) || 5000;

  // Multi-agency requirement state (e.g., 700 Water required)
  const [requiredQuantity, setRequiredQuantity] = useState<number>(700);
  const [destinationDistrict, setDestinationDistrict] = useState("Colombo");
  const [responsibleAgency, setResponsibleAgency] = useState("Navy Special Boat Squadron #1");
  const [eta, setEta] = useState("2 Hours (Today 18:00)");

  // Multi-agency source allocation state (Example: Agency A has 400, Agency B has 300)
  const [agencyItems, setAgencyItems] = useState<AgencyStockItem[]>([
    {
      agency: "Government — DMC Main Warehouse",
      resourceId: "RES-WATER-01",
      available: 400,
      allocated: 400,
    },
    {
      agency: "NGO — Red Cross Relief Fleet",
      resourceId: "RES-WATER-02",
      available: 300,
      allocated: 300,
    },
    {
      agency: "Armed Forces — Navy Logistics",
      resourceId: "RES-WATER-03",
      available: 800,
      allocated: 0,
    },
  ]);

  const [validating, setValidating] = useState(false);
  const [serverError, setServerError] = useState("");

  // Re-fetch live DB resource stock on mount to ensure server-side accuracy
  useEffect(() => {
    fetch("/api/relief-resources")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.resources && data.resources.length > 0) {
          const waterRes = data.resources.find((r: RawResourceItem) =>
            r.name.toLowerCase().includes("water")
          );
          if (waterRes && waterRes.quantity > 0) {
            setAgencyItems((prev) => [
              { ...prev[0], available: Math.min(400, waterRes.quantity) },
              { ...prev[1], available: Math.min(300, waterRes.quantity) },
              { ...prev[2], available: Math.min(800, waterRes.quantity) },
            ]);
          }
        }
      })
      .catch(() => {
        // Fallback to initial state
      });
  }, []);

  // Live fulfillment calculations
  const totalAllocated = agencyItems.reduce((acc, curr) => acc + (curr.allocated || 0), 0);
  const remainingRequirement = Math.max(0, requiredQuantity - totalAllocated);

  // Over-allocation and stock availability checks
  const isOverAllocated = agencyItems.some((item) => item.allocated > item.available);
  const isValidAllocation = totalAllocated > 0 && !isOverAllocated;

  const handleAgencyAllocChange = (index: number, val: number) => {
    const next = [...agencyItems];
    next[index].allocated = Math.max(0, val);
    setAgencyItems(next);
    setServerError("");
  };

  const getResourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("water")) return <Droplet className="w-4 h-4 text-blue-400" />;
    if (lower.includes("food") || lower.includes("ration")) return <Package className="w-4 h-4 text-amber-400" />;
    if (lower.includes("med") || lower.includes("health")) return <Activity className="w-4 h-4 text-red-400" />;
    return <Boxes className="w-4 h-4 text-slate-400" />;
  };

  const handleContinueToReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAllocation) return;

    setValidating(true);
    setServerError("");

    try {
      // Re-validate against server DB availability before proceeding
      const activeAllocations = agencyItems.filter((i) => i.allocated > 0);
      const res = await fetch("/api/relief-resources/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: activeAllocations.map((a) => ({
            resourceId: a.resourceId,
            quantity: a.allocated,
            agency: a.agency,
          })),
          district: destinationDistrict,
          requirementNotes: `Multi-agency dispatch for ${requiredQuantity} ${resourceName} units`,
        }),
      });

      if (res.ok) {
        const selectedAgencies = activeAllocations.map((a) => a.agency).join(", ");
        const queryParams = new URLSearchParams({
          name: resourceName,
          owner: selectedAgencies,
          district: destinationDistrict,
          agency: responsibleAgency,
          eta: eta,
          quantity: String(totalAllocated),
          stock: String(initialStock),
          remaining: String(remainingRequirement),
        });

        router.push(`/dmc/relief-resources/review?${queryParams.toString()}`);
      } else {
        const errData = await res.json();
        setServerError(errData.message || "Server validation failed. Stock unavailable.");
      }
    } catch {
      setServerError("Network error re-validating stock levels with DMC server.");
    } finally {
      setValidating(false);
    }
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
            <span className="text-slate-200 font-semibold">{resourceName}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create Relief Resource Distribution
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Send available stock to an affected district using multi-agency sourcing.
          </p>
        </div>

        <Link
          href="/dmc/relief-resources"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {serverError && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleContinueToReview} className="space-y-6">
        {/* Main 2-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Distribution details Panel (2/3 width) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-bold text-white">Distribution details</h2>
              <p className="text-xs text-slate-400">
                Confirm required quantity, then select resources from multiple agencies to meet the total requirement.
              </p>
            </div>

            <div className="space-y-4">
              {/* Field 1: Selected resource */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Selected resource
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    {getResourceIcon(resourceName)}
                  </div>
                  <span>{resourceName}</span>
                </div>
              </div>

              {/* Field 2: Required Quantity Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Total required quantity ({resourceName})
                </label>
                <input
                  type="number"
                  min={1}
                  value={requiredQuantity || ""}
                  onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Field 3: Multi-Agency Sourcing Allocation Table */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Select resources from multiple agencies</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Allocated: {totalAllocated} / {requiredQuantity} units
                  </span>
                </label>

                <div className="space-y-2.5 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                  {agencyItems.map((item, idx) => {
                    const overStock = item.allocated > item.available;
                    return (
                      <div
                        key={item.agency}
                        className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800/60 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-200 min-w-[200px]">
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-white">{item.agency}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Available: {item.available} units
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Allocate:</span>
                          <input
                            type="number"
                            min={0}
                            max={item.available}
                            value={item.allocated}
                            onChange={(e) => handleAgencyAllocChange(idx, Number(e.target.value))}
                            className={`w-24 px-2.5 py-1 rounded-lg bg-slate-900 border text-xs font-mono font-bold text-white ${
                              overStock
                                ? "border-red-500 text-red-300"
                                : "border-slate-700 focus:border-blue-500"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Field 4: Destination district */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Destination district
                </label>
                <select
                  value={destinationDistrict}
                  onChange={(e) => setDestinationDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Galle">Galle</option>
                  <option value="Ratnapura">Ratnapura</option>
                </select>
              </div>

              {/* Field 5: Responsible agency / Dispatch team */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Responsible agency / Dispatch team
                </label>
                <div className="relative">
                  <select
                    value={responsibleAgency}
                    onChange={(e) => setResponsibleAgency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors appearance-none pr-8 cursor-pointer"
                  >
                    <option value="Navy Special Boat Squadron #1">Navy Special Boat Squadron #1</option>
                    <option value="Army 58 Division Relief Convoy">Army 58 Division Relief Convoy</option>
                    <option value="Sri Lanka Red Cross Quick Response Unit">Sri Lanka Red Cross Quick Response Unit</option>
                    <option value="DMC District Emergency Taskforce">DMC District Emergency Taskforce</option>
                  </select>
                  <Truck className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Field 6: Estimated arrival time (ETA) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Estimated arrival time (ETA)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors pr-8"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stock preview Panel (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="pb-3 border-b border-slate-800/80">
                <h2 className="text-base font-bold text-white">Stock preview</h2>
                <p className="text-xs text-slate-400">
                  Updates automatically as you enter values.
                </p>
              </div>

              {/* Large Stock Display */}
              <div className="space-y-1 py-1">
                <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
                  {totalAllocated.toLocaleString()}
                </div>
                <span className="text-xs text-slate-400 block">
                  units total allocated
                </span>
              </div>

              {/* Live Required / Allocated / Remaining Breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Required quantity</span>
                  <span className="font-mono font-medium">{requiredQuantity.toLocaleString()} units</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Allocated quantity</span>
                  <span className="font-mono font-bold text-blue-400">{totalAllocated.toLocaleString()} units</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-white font-bold">
                  <span>Remaining requirement</span>
                  <span className={`font-mono text-sm ${remainingRequirement === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    {remainingRequirement.toLocaleString()} units
                  </span>
                </div>
              </div>

              {/* Validation Helper Banner */}
              {isValidAllocation ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Sufficient stock allocated across selected agencies</span>
                </div>
              ) : isOverAllocated ? (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Allocation exceeds available agency stock</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Link
            href="/dmc/relief-resources"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={!isValidAllocation || validating}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/20 transition-all ${
              isValidAllocation && !validating
                ? "bg-blue-600 hover:bg-blue-500 active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>{validating ? "Re-validating..." : "Continue to review"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateDistributionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <CreateDistributionFormContent />
    </Suspense>
  );
}
