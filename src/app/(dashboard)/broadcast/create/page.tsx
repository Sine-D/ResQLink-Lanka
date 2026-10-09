"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapAreaPicker, { DISTRICT_BOUNDS } from "@/components/warnings/MapAreaPicker";
import {
  ShieldAlert,
  AlertCircle,
  Clock,
  MapPin,
  Save,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { estimateDistrictReach } from "@/lib/utils/reachEstimator";

const DEFAULT_POLYGON = [
  [
    [79.84, 6.9],
    [79.88, 6.9],
    [79.88, 6.96],
    [79.84, 6.96],
    [79.84, 6.9],
  ],
];

const HAZARD_TYPES = ["Flood", "Landslide", "Cyclone", "Tsunami", "Drought", "FlashFlood"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

interface VerifiedIncident {
  id: string;
  code?: string;
  type: string;
  title: string;
  displayLabel?: string;
  hazardType: string;
  district: string;
  severity: string;
  description: string;
  instructions: string;
  date: string;
}

function CreateBroadcastForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editDraftId = searchParams.get("editDraft") || searchParams.get("draftId");

  const [hazardType, setHazardType] = useState("Flood");
  const [severity, setSeverity] = useState("High");
  const [districtName, setDistrictName] = useState("Colombo");
  const [coordinates, setCoordinates] = useState<number[][][]>(DEFAULT_POLYGON);
  const [instructions, setInstructions] = useState(
    "Evacuate low-lying river bank regions immediately. Move to designated DMC emergency shelters."
  );
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().slice(0, 16));
  const [validUntil, setValidUntil] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );

  const [verifiedIncidents, setVerifiedIncidents] = useState<VerifiedIncident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [filterByDistrict, setFilterByDistrict] = useState(true);

  const [error, setError] = useState("");
  const [overlapWarning, setOverlapWarning] = useState<any>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [validating, setValidating] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const estimatedReach = estimateDistrictReach(districtName);

  // Load existing draft if editing (Flow A3)
  useEffect(() => {
    if (editDraftId) {
      fetch(`/api/warnings/${editDraftId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.warning) {
            const w = data.warning;
            setHazardType(w.hazardType || "Flood");
            setSeverity(w.severity || "High");
            setDistrictName(w.targetArea?.districtName || "Colombo");
            if (w.targetArea?.coordinates?.coordinates) {
              setCoordinates(w.targetArea.coordinates.coordinates);
            }
            setInstructions(w.instructions || "");
            if (w.validFrom) setValidFrom(new Date(w.validFrom).toISOString().slice(0, 16));
            if (w.validUntil) setValidUntil(new Date(w.validUntil).toISOString().slice(0, 16));
            if (w.sourceIncidentId) setSelectedIncidentId(w.sourceIncidentId);
          }
        })
        .catch(() => console.error("Could not fetch draft for editing"));
    }
  }, [editDraftId]);

  // Fetch verified incidents filtered from database by district if enabled
  useEffect(() => {
    let isMounted = true;
    setLoadingIncidents(true);
    const query = filterByDistrict && districtName ? `?district=${encodeURIComponent(districtName)}` : "";
    fetch(`/api/warnings/verified-incidents${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.incidents) {
          setVerifiedIncidents(data.incidents);
        }
      })
      .catch((err) => console.error("Error fetching verified incidents", err))
      .finally(() => {
        if (isMounted) setLoadingIncidents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [districtName, filterByDistrict]);

  // Check duplicate active warnings for this district and hazard (E3)
  useEffect(() => {
    if (districtName && hazardType) {
      const url = `/api/warnings/check-overlap?district=${encodeURIComponent(districtName)}&hazardType=${encodeURIComponent(hazardType)}${editDraftId ? `&excludeId=${editDraftId}` : ""}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.hasOverlap && data.existingWarning) {
            setOverlapWarning(data.existingWarning);
          } else {
            setOverlapWarning(null);
          }
        })
        .catch(() => setOverlapWarning(null));
    }
  }, [districtName, hazardType, editDraftId]);

  // Autofill when a verified incident is selected from database
  const handleSelectIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    if (!incidentId) return;

    const inc = verifiedIncidents.find((i) => i.id === incidentId);
    if (inc) {
      if (HAZARD_TYPES.includes(inc.hazardType)) {
        setHazardType(inc.hazardType);
      }
      if (inc.district) {
        setDistrictName(inc.district);
        if (DISTRICT_BOUNDS[inc.district]?.poly) {
          setCoordinates(DISTRICT_BOUNDS[inc.district].poly);
        }
      }
      if (inc.severity && SEVERITIES.includes(inc.severity)) {
        setSeverity(inc.severity);
      }
      if (inc.instructions) {
        setInstructions(inc.instructions);
      }
      setSuccessToast(`Autofilled criteria from database incident: [${inc.code || inc.id}] ${inc.title} (${inc.district})`);
      setTimeout(() => setSuccessToast(""), 4500);
    }
  };

  const handleDistrictChange = (district: string, polyCoords: number[][][]) => {
    setDistrictName(district);
    setCoordinates(polyCoords);
  };

  // E1 & E2 Client Validation
  const validateForm = () => {
    if (!instructions || instructions.trim().length < 10) {
      setError("Safety instructions must be at least 10 characters long (E1).");
      return false;
    }
    const from = new Date(validFrom);
    const until = new Date(validUntil);
    if (until <= from) {
      setError("End Time (validUntil) must be strictly after Start Time (validFrom) (E1).");
      return false;
    }
    if (!coordinates || !coordinates[0] || coordinates[0].length < 4) {
      setError("Target boundary polygon must contain at least 4 closed coordinate points (E2).");
      return false;
    }
    return true;
  };

  // Save as Draft (Flow A2)
  const handleSaveAsDraft = async () => {
    setError("");
    if (!validateForm()) return;
    setSavingDraft(true);

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
        sourceIncidentId: selectedIncidentId || undefined,
      };

      const url = editDraftId ? `/api/warnings/${editDraftId}` : "/api/warnings";
      const method = editDraftId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to save draft warning.");
      } else {
        setSuccessToast("Warning draft saved successfully as DRAFT (A2).");
        setTimeout(() => setSuccessToast(""), 4000);
      }
    } catch {
      setError("Network error while saving draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  // Review & Validation -> Navigate to /broadcast/review/[id]
  const handleProceedToReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setValidating(true);

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
        sourceIncidentId: selectedIncidentId || undefined,
      };

      const url = editDraftId ? `/api/warnings/${editDraftId}` : "/api/warnings";
      const method = editDraftId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Validation failed.");
        setValidating(false);
      } else {
        const warningId = data.warning.warningId;
        router.push(`/broadcast/review/${warningId}`);
      }
    } catch {
      setError("An unexpected error occurred.");
      setValidating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <span>Issue Location-Based Disaster Warning</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            UC1 - Step 1: Define disaster criteria, geofenced boundaries, and emergency broadcast instructions.
          </p>
        </div>

        {editDraftId && (
          <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-bold">
            Editing Draft: {editDraftId.slice(0, 8)}...
          </span>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Validation / Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Optional: Based on Verified Incident Dropdown */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Based on Verified Incident</span>
          </label>

          {/* District Filter Toggles */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterByDistrict(true)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                filterByDistrict
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📍 Filter by {districtName}
            </button>
            <button
              type="button"
              onClick={() => setFilterByDistrict(false)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                !filterByDistrict
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🌐 All Districts
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>
            <strong className="text-white font-mono">{verifiedIncidents.length}</strong> verified incident(s) available in{" "}
            <strong className="text-red-400">{filterByDistrict ? districtName : "All Districts"}</strong>
          </span>

          {filterByDistrict && verifiedIncidents.length === 0 && !loadingIncidents && (
            <button
              type="button"
              onClick={() => setFilterByDistrict(false)}
              className="text-red-400 hover:text-red-300 underline font-medium text-[11px]"
            >
              Switch to All Districts to view available reports
            </button>
          )}
        </div>

        <select
          value={selectedIncidentId}
          onChange={(e) => handleSelectIncident(e.target.value)}
          style={{ backgroundColor: "#020617", color: "#f8fafc" }}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500 font-medium shadow-inner"
        >
          <option value="" style={{ backgroundColor: "#020617", color: "#94a3b8" }}>
            {verifiedIncidents.length === 0
              ? `-- No verified incidents in ${districtName} --`
              : `-- Select a verified incident to autofill --`}
          </option>
          {verifiedIncidents.map((inc) => (
            <option
              key={inc.id}
              value={inc.id}
              style={{ backgroundColor: "#020617", color: "#f8fafc" }}
            >
              {inc.displayLabel || `[${inc.code || inc.id}] ${inc.title} • ${inc.district} (${inc.severity} Severity)`}
            </option>
          ))}
        </select>

        {selectedIncidentId && (
          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Linked Source Incident:</span>
              <span className="font-mono text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {selectedIncidentId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIncidentId("")}
              className="text-[11px] text-slate-400 hover:text-red-400 underline transition-colors"
            >
              Clear Link
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleProceedToReview} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
            Warning Parameters & Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hazard Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hazard Type <span className="text-red-500">*</span>
              </label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                style={{ backgroundColor: "#020617", color: "#f8fafc" }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500 font-semibold"
              >
                {HAZARD_TYPES.map((h) => (
                  <option key={h} value={h} style={{ backgroundColor: "#020617", color: "#f8fafc" }}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Severity Level <span className="text-red-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{
                  backgroundColor: "#020617",
                  color:
                    severity === "High" || severity === "Critical"
                      ? "#f87171"
                      : severity === "Medium"
                      ? "#fbbf24"
                      : "#f8fafc",
                }}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-xs focus:outline-none font-bold ${
                  severity === "High" || severity === "Critical"
                    ? "border-red-500 text-red-400"
                    : severity === "Medium"
                    ? "border-amber-500 text-amber-400"
                    : "border-slate-800 text-slate-300"
                }`}
              >
                {SEVERITIES.map((s) => (
                  <option
                    key={s}
                    value={s}
                    style={{
                      backgroundColor: "#020617",
                      color:
                        s === "High" || s === "Critical"
                          ? "#f87171"
                          : s === "Medium"
                          ? "#fbbf24"
                          : "#f8fafc",
                    }}
                  >
                    {s} Severity {s === "High" || s === "Critical" ? "(Confirmation Modal Required)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Time (validFrom)</span>
              </label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
                style={{ backgroundColor: "#020617", color: "#f8fafc", colorScheme: "dark" }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>End Time (validUntil)</span>
              </label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
                style={{ backgroundColor: "#020617", color: "#f8fafc", colorScheme: "dark" }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Safety Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Safety Instructions & Directives (Min 10 characters) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              minLength={10}
              placeholder="Provide clear, concise citizen safety and evacuation directives..."
              style={{ backgroundColor: "#020617", color: "#f8fafc" }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500 leading-relaxed"
            />
            <div className="text-[10px] text-slate-500 text-right mt-1">
              {instructions.length} characters (valid minimum: 10)
            </div>
          </div>
        </div>

        {/* GIS Map & TargetArea Polygon Geofencing */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Target Area & Demographic Reach
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                TargetArea validation calculates estimated cellular broadcast reach.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Estimated Reach:</span>
              <div className="text-base font-extrabold text-red-400 font-mono">
                {estimatedReach.toLocaleString()} citizens
              </div>
            </div>
          </div>

          <MapAreaPicker districtName={districtName} onDistrictChange={handleDistrictChange} />
        </div>

        {/* Action Buttons: Save as Draft (A2) + Proceed to Review */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={savingDraft}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs transition-all shadow-md"
          >
            <Save className="w-4 h-4 text-slate-400" />
            <span>{savingDraft ? "Saving Draft..." : "Save as Draft (A2)"}</span>
          </button>

          <button
            type="submit"
            disabled={validating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/30 transition-all ml-auto"
          >
            <span>{validating ? "Validating..." : "Proceed to Review & Validation"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateBroadcastPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400 text-sm">Loading Broadcast Creator...</div>}>
      <CreateBroadcastForm />
    </Suspense>
  );
}
