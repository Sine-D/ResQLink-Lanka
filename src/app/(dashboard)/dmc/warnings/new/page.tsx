"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MapAreaPicker from "@/components/warnings/MapAreaPicker";
import { AlertCircle, ArrowRight, ShieldAlert, Users, Save } from "lucide-react";
import { estimateDistrictReach } from "@/lib/utils/reachEstimator";

const DEFAULT_POLYGON = [
  [
    [79.84, 6.90],
    [79.88, 6.90],
    [79.88, 6.96],
    [79.84, 6.96],
    [79.84, 6.90],
  ],
];

export default function CreateWarningPage() {
  const router = useRouter();
  const [hazardType, setHazardType] = useState("Flood");
  const [severity, setSeverity] = useState("High");
  const [districtName, setDistrictName] = useState("Colombo");
  const [coordinates, setCoordinates] = useState<number[][][]>(DEFAULT_POLYGON);
  const [instructions, setInstructions] = useState(
    "Evacuate low-lying river bank regions immediately. Seek shelter on higher ground or designated DMC safe locations."
  );
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 16));
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const estimatedReach = estimateDistrictReach(districtName);

  const handleDistrictChange = (district: string, polyCoords: number[][][]) => {
    setDistrictName(district);
    setCoordinates(polyCoords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        hazardType,
        severity,
        districtName,
        coordinates: {
          type: "Polygon",
          coordinates,
        },
        instructions,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
      };

      const res = await fetch("/api/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to create warning draft");
        setLoading(false);
      } else {
        router.push(`/dmc/warnings/${data.warning.warningId}/review`);
      }
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          Issue Location-Based Disaster Warning
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Step 1 of 2: Define hazard criteria, target district boundary, and emergency safety instructions.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hazard & Severity Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Disaster Hazard Type</label>
            <select
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-semibold"
            >
              <option value="Flood">Flood</option>
              <option value="Landslide">Landslide</option>
              <option value="Cyclone">Cyclone</option>
              <option value="Tsunami">Tsunami</option>
              <option value="Drought">Drought</option>
              <option value="FlashFlood">Flash Flood</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-semibold"
            >
              <option value="Low">Low (Informational)</option>
              <option value="Medium">Medium (Advisory)</option>
              <option value="High">High (Immediate Action)</option>
              <option value="Critical">Critical (Severe Emergency)</option>
            </select>
          </div>
        </div>

        {/* Map Geofence Area Selection */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <MapAreaPicker districtName={districtName} onDistrictChange={handleDistrictChange} />

          {/* Live Population Reach Estimate Metric */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Estimated Population Reach</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {estimatedReach.toLocaleString()} Citizens
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              Density Matrix Lookup
            </span>
          </div>
        </div>

        {/* Instructions & Timestamps */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Public Safety Instructions (min 10 characters)
            </label>
            <textarea
              rows={4}
              required
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valid From</label>
              <input
                type="datetime-local"
                required
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valid Until</label>
              <input
                type="datetime-local"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Draft..." : "Save Draft & Proceed to Review"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
