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
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck,
} from "lucide-react";

function CreateDistributionFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected resource details from URL query or defaults
  const resourceName = searchParams.get("name") || "Water";
  const initialAvailableStock = Number(searchParams.get("stock")) || 5000;
  const initialOwner = searchParams.get("owner") || "Government";

  // Form State
  const [selectedOwner, setSelectedOwner] = useState(initialOwner);
  const [destinationDistrict, setDestinationDistrict] = useState("Colombo");
  const [responsibleAgency, setResponsibleAgency] = useState("Navy Special Boat Squadron #1");
  const [eta, setEta] = useState("2 Hours (Today 18:00)");
  const [quantity, setQuantity] = useState<number>(1500);

  // Available total stock calculation
  const availableStock = initialAvailableStock;
  const remainingStock = Math.max(0, availableStock - (quantity || 0));
  const isValidQuantity = quantity > 0 && quantity <= availableStock;

  const getResourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("water")) return <Droplet className="w-4 h-4 text-blue-400" />;
    if (lower.includes("food") || lower.includes("ration")) return <Package className="w-4 h-4 text-amber-400" />;
    if (lower.includes("med") || lower.includes("health")) return <Activity className="w-4 h-4 text-red-400" />;
    return <Boxes className="w-4 h-4 text-slate-400" />;
  };

  const handleContinueToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidQuantity) return;

    const queryParams = new URLSearchParams({
      name: resourceName,
      owner: selectedOwner,
      district: destinationDistrict,
      agency: responsibleAgency,
      eta: eta,
      quantity: String(quantity),
      stock: String(availableStock),
      remaining: String(remainingStock),
    });

    router.push(`/dmc/relief-resources/review?${queryParams.toString()}`);
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
            Send available stock to an affected district.
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

      <form onSubmit={handleContinueToReview} className="space-y-6">
        {/* Main 2-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Distribution details Panel (2/3 width) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-bold text-white">Distribution details</h2>
              <p className="text-xs text-slate-400">
                Confirm the resource, then choose a destination, multi-agency source, and quantity.
              </p>
            </div>

            <div className="space-y-4">
              {/* Field 1: Selected resource (Read-only display) */}
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

              {/* Field 2: Resource owner / Multi-agency source */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Resource owner (Multi-agency source)
                </label>
                <div className="relative">
                  <select
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors appearance-none pr-8 cursor-pointer"
                  >
                    <option value="Government">Government — DMC Main Warehouse</option>
                    <option value="NGO — Red Cross">NGO — Red Cross Relief Fleet</option>
                    <option value="Armed Forces">Armed Forces — Navy & Army Logistics</option>
                    <option value="Multi-Agency Joint Fleet">Multi-Agency Joint Fleet (Combined)</option>
                  </select>
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Field 3: Destination district */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Destination district
                </label>
                <div className="relative">
                  <select
                    value={destinationDistrict}
                    onChange={(e) => setDestinationDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors appearance-none pr-8 cursor-pointer"
                  >
                    <option value="Colombo">Colombo</option>
                    <option value="Gampaha">Gampaha</option>
                    <option value="Kalutara">Kalutara</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Galle">Galle</option>
                    <option value="Ratnapura">Ratnapura</option>
                    <option value="Matara">Matara</option>
                    <option value="Kegalle">Kegalle</option>
                    <option value="Batticaloa">Batticaloa</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-400 w-0 h-0" />
                </div>
              </div>

              {/* Field 4: Responsible agency / Dispatch team */}
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

              {/* Field 5: Estimated arrival time (ETA) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Estimated arrival time (ETA)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder="e.g. 2 Hours (Today 18:00)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors pr-8"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Field 6: Quantity to distribute */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Quantity to distribute
                </label>
                <input
                  type="number"
                  min={1}
                  max={availableStock}
                  value={quantity || ""}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />

                {/* Helper text below field */}
                {isValidQuantity ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Within available stock — {quantity.toLocaleString()} of {availableStock.toLocaleString()} units
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-red-400 pt-1 font-medium">
                    Please enter a valid quantity up to {availableStock.toLocaleString()} units.
                  </div>
                )}
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

              {/* Large Current Stock Display */}
              <div className="space-y-1 py-1">
                <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
                  {availableStock.toLocaleString()}
                </div>
                <span className="text-xs text-slate-400 block">
                  units currently available
                </span>
              </div>

              {/* Required / Allocated / Remaining Breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Required quantity</span>
                  <span className="font-mono font-medium">{quantity > 0 ? `${quantity.toLocaleString()} units` : "0 units"}</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Allocated quantity</span>
                  <span className="font-mono font-medium">{quantity > 0 ? `${quantity.toLocaleString()} units` : "0 units"}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-white font-bold">
                  <span>Remaining after distribution</span>
                  <span className="font-mono text-sm text-emerald-400">{remainingStock.toLocaleString()} units</span>
                </div>
              </div>
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
            disabled={!isValidQuantity}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/20 transition-all ${
              isValidQuantity
                ? "bg-blue-600 hover:bg-blue-500 active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>Continue to review</span>
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
