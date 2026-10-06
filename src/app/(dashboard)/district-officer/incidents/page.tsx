"use client";

import React, { useState, useEffect } from "react";
import { Truck, Send, CheckCircle2, AlertTriangle, Users, Plus, X, Pencil, Trash2 } from "lucide-react";

interface Incident {
  _id: string;
  incidentId: string;
  title: string;
  district: string;
  locationName: string;
  severity: string;
  status: string;
  trappedCount: number;
  description: string;
}

interface RescueTeam {
  teamId: string;
  name: string;
  district: string;
  memberCount: number;
}

const INCIDENT_TITLES = ["Flood", "Tsunami", "Landslide", "Fire", "Strong Winds", "Droughts", "Earth Tremors", "Lightning Strikes", "Tropical Cyclones"];

export default function IncidentsManagementPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dispatchedIncidents, setDispatchedIncidents] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: INCIDENT_TITLES[0],
    district: "",
    locationName: "",
    severity: "Medium",
    trappedCount: 0,
    description: "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedIncident, setEditedIncident] = useState<Incident | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/incidents");
      const data = await res.json();
      if (res.ok) {
        setIncidents(data.incidents || []);
        setTeams(data.teams || []);
        setDistricts(data.districts || []);
        
        // Ensure default values if lists exist and formData is empty
        if (!formData.district && (data.districts || []).length > 0) {
          setFormData(prev => ({ ...prev, district: data.districts[0] }));
        }

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "trappedCount" ? parseInt(value) || 0 : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          title: INCIDENT_TITLES[0],
          district: districts[0] || "",
          locationName: "",
          severity: "Medium",
          trappedCount: 0,
          description: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to submit incident:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editedIncident) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/incidents/${editedIncident._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedIncident),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update incident:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete incident:", error);
    }
  };

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
    <div className="space-y-6 relative pb-12">
      <h1 className="text-2xl font-black text-white mb-2">Incident Management</h1>

      {/* Report Incident Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Report New Incident</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Incident Title</label>
            <select name="title" required value={formData.title} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              {INCIDENT_TITLES.map((title) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">District</label>
            <select name="district" required value={formData.district} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Location Details</label>
            <input type="text" name="locationName" required value={formData.locationName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Location Name" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Severity</label>
            <select name="severity" value={formData.severity} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">People Trapped (Est.)</label>
            <input type="number" name="trappedCount" min="0" required value={formData.trappedCount} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <label className="text-xs font-semibold text-slate-400">Description</label>
            <textarea name="description" rows={2} required value={formData.description} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" placeholder="Provide incident details..."></textarea>
          </div>
          <div className="md:col-span-2 lg:col-span-3 pt-2">
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50">
              {submitting ? "Reporting..." : "Report Incident"}
            </button>
          </div>
        </form>
      </div>

      <div className="pb-4 mt-8 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-500" />
          Active Incidents & Dispatch
        </h2>
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

            return (
              <div key={incident.incidentId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 transition-all relative group">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditedIncident(incident); setIsEditModalOpen(true); }} className="p-2 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(incident._id)} className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex justify-between items-start pb-4 border-b border-slate-800 pr-24">
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

                <p className="text-sm text-slate-300">{incident.description}</p>
                <p className="text-xs text-slate-500">Location: {incident.locationName}</p>

                {isDispatched ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 mt-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Rescue Team #{teamId} Dispatched to Scene!</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 mt-2 border-t border-slate-800/50">
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

      {/* Edit Modal */}
      {isEditModalOpen && editedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Edit Incident</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Incident Title</label>
                  <select value={editedIncident.title} onChange={(e) => setEditedIncident({...editedIncident, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    {INCIDENT_TITLES.map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                    {!INCIDENT_TITLES.includes(editedIncident.title) && (
                      <option value={editedIncident.title}>{editedIncident.title}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Severity</label>
                  <select value={editedIncident.severity} onChange={(e) => setEditedIncident({...editedIncident, severity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">District</label>
                  <select value={editedIncident.district} onChange={(e) => setEditedIncident({...editedIncident, district: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    {districts.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Location Name</label>
                  <input type="text" value={editedIncident.locationName} onChange={(e) => setEditedIncident({...editedIncident, locationName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">People Trapped (Est.)</label>
                  <input type="number" min="0" value={editedIncident.trappedCount} onChange={(e) => setEditedIncident({...editedIncident, trappedCount: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select value={editedIncident.status} onChange={(e) => setEditedIncident({...editedIncident, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="OPEN">Open</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea rows={3} value={editedIncident.description} onChange={(e) => setEditedIncident({...editedIncident, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleEdit} disabled={updating} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
