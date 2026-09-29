"use client";

import React, { useState, useEffect } from "react";
import { Truck, Send, CheckCircle2, AlertTriangle, Users } from "lucide-react";

interface Incident {
  incidentId: string;
  title: string;
  district: string;
  severity: string;
  trappedCount: number;
}

interface RescueTeam {
  teamId: string;
  name: string;
  district: string;
  memberCount: number;
}

export default function IncidentsDispatchPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchedIncidents, setDispatchedIncidents] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/incidents");
        const data = await res.json();
        if (res.ok) {
          setIncidents(data.incidents || []);
          setTeams(data.teams || []);
          
          // Auto-select the first available team for each incident in the same district if possible
          const initialSelections: Record<string, string> = {};
          (data.incidents || []).forEach((inc: Incident) => {
            const suitableTeam = (data.teams || []).find((t: RescueTeam) => t.district === inc.district) 
                                 || (data.teams || [])[0];
            if (suitableTeam) {
              initialSelections[inc.incidentId] = suitableTeam.teamId;
            }
          });
          setSelectedTeams(initialSelections);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDispatch = async (incidentId: string) => {
    const teamId = selectedTeams[incidentId];
    if (!teamId) {
      alert("Please select a team first");
      return;
    }

    try {
      const res = await fetch(`/api/incidents/${incidentId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, notes: "Dispatched from District Officer Dashboard" }),
      });
      if (res.ok) {
        setDispatchedIncidents((prev) => [...prev, incidentId]);
        // Also remove the team from available teams list to prevent double dispatch
        setTeams((prev) => prev.filter(t => t.teamId !== teamId));
      } else {
        const data = await res.json();
        alert(data.error || "Dispatch failed");
      }
    } catch {
      alert("Dispatch failed due to network error");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "HIGH": return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "MEDIUM": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "LOW": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  if (loading) {
    return <div className="p-6 text-white text-center">Loading incidents...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-500" />
          Shelter & Rescue Coordination
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Select open incidents and assign available emergency rescue teams.
        </p>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          No open incidents at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => {
            const isDispatched = dispatchedIncidents.includes(incident.incidentId);
            const teamId = selectedTeams[incident.incidentId];
            const teamName = teams.find(t => t.teamId === teamId)?.name || "Unknown Team";

            return (
              <div key={incident.incidentId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 transition-all">
                <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {incident.title}
                      <span className="text-sm font-normal text-slate-400">(#{incident.incidentId})</span>
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{incident.district} District</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {incident.trappedCount} Trapped
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(incident.severity)}`}>
                    {incident.severity.toUpperCase()}
                  </span>
                </div>

                {isDispatched ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Rescue Team #{teamId} Dispatched to Scene!</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300">Assign Team:</span>
                      <select 
                        value={teamId || ""} 
                        onChange={(e) => setSelectedTeams({...selectedTeams, [incident.incidentId]: e.target.value})}
                        className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        disabled={teams.length === 0}
                      >
                        {teams.length === 0 ? (
                          <option value="">No teams available</option>
                        ) : (
                          teams.map(t => (
                            <option key={t.teamId} value={t.teamId}>
                              {t.name} ({t.memberCount} Members, {t.district})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    <button
                      onClick={() => handleDispatch(incident.incidentId)}
                      disabled={teams.length === 0 || !teamId}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Dispatch Team</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
