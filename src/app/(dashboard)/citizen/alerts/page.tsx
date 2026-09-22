"use client";

import React, { useEffect, useState } from "react";
import CitizenAlertCard from "@/components/warnings/CitizenAlertCard";
import { Bell, MapPin, RefreshCw, ShieldCheck } from "lucide-react";

export default function CitizenAlertFeedPage() {
  const [selectedDistrict, setSelectedDistrict] = useState("Colombo");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async (district: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/warnings?mode=active&district=${district}`);
      const data = await res.json();
      setAlerts(data.warnings || []);
    } catch {
      console.error("Failed to fetch citizen alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(selectedDistrict);
  }, [selectedDistrict]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-500 animate-bounce" />
            Citizen Emergency Disaster Alert Feed
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency warning notifications broadcast by the Disaster Management Center
          </p>
        </div>

        {/* District Selector */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <MapPin className="w-4 h-4 text-red-400" />
          <span className="text-xs text-slate-400 font-semibold">District:</span>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs font-bold px-3 py-1 rounded-lg focus:outline-none focus:border-red-500"
          >
            <option value="Colombo">Colombo</option>
            <option value="Gampaha">Gampaha</option>
            <option value="Kalutara">Kalutara</option>
            <option value="Kandy">Kandy</option>
            <option value="Galle">Galle</option>
            <option value="Ratnapura">Ratnapura</option>
            <option value="ALL">All Districts</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
          <span>Checking emergency alert feed for {selectedDistrict}...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Emergency Warnings</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no active disaster warning alerts issued for {selectedDistrict} district. Stay safe!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {alerts.map((alertItem) => (
            <CitizenAlertCard key={alertItem.warningId} warning={alertItem} />
          ))}
        </div>
      )}
    </div>
  );
}
