"use client";

import React, { useState } from "react";
import { Truck, Send, CheckCircle2 } from "lucide-react";

export default function IncidentsDispatchPage() {
  const [dispatched, setDispatched] = useState(false);

  const handleDispatch = async () => {
    try {
      const res = await fetch("/api/incidents/INC-101/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json font-bold" },
        body: JSON.stringify({ teamId: "TEAM-COLOMBO-1" }),
      });
      if (res.ok) setDispatched(true);
    } catch {
      alert("Dispatch failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-500" />
          Rescue Incidents & Team Dispatch (Member 3 Stub)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scaffold page for Member 3. Select open incident and assign available emergency rescue teams.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Incident #INC-101: Trapped Citizens at Kelani Bank</h3>
            <span className="text-xs text-slate-400">Colombo District | Severity: Critical</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
            OPEN
          </span>
        </div>

        {dispatched ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Rescue Team #TEAM-COLOMBO-1 Dispatched to Scene!</span>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-300">Available Team: <strong>Navy Special Boat Squadron (4 Members)</strong></span>
            <button
              onClick={handleDispatch}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Assign Rescue Team</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
