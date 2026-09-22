"use client";

import React, { useState } from "react";
import { AlertTriangle, Send, CheckCircle2 } from "lucide-react";

export default function ReportHazardPage() {
  const [hazardType, setHazardType] = useState("Flood");
  const [locationName, setLocationName] = useState("Kelani River Bank, Kolonnawa");
  const [description, setDescription] = useState("Rapidly rising water entering houses on Main Street.");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hazardType, locationName, description }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      alert("Submission failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          Report a Local Hazard (Member 2 Stub)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scaffold page for Citizen Hazard Reporting module. Saves report as PENDING_VERIFICATION.
        </p>
      </div>

      {submitted ? (
        <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Hazard Report Submitted</h3>
          <p className="text-xs text-slate-300">Your report has been queued for DMC officer verification.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hazard Type</label>
            <select
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            >
              <option value="Flood">Flood / Rising Water</option>
              <option value="Landslide">Landslide / Earth Slip</option>
              <option value="FallenTree">Fallen Tree / Blocked Road</option>
              <option value="PowerLine">Damaged Power Lines</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Landmark</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Hazard Report</span>
          </button>
        </form>
      )}
    </div>
  );
}
