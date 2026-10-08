"use client";

import React, { useState, useEffect } from "react";
import { MapPin, AlertTriangle, Save, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const MapSelector = dynamic(() => import("@/components/MapSelector"), { ssr: false });

interface Shelter {
  _id: string;
  shelterId: string;
  name: string;
  location: string;
  capacity: number;
  occupancy: number;
  status: string;
}

export default function EvacueePage() {
  const [formData, setFormData] = useState({
    headOfHousehold: "",
    headOfHouseholdAge: "",
    householdSize: 1,
    vulnerability: "",
    originAddress: "",
    gpsStatus: "40.7128° N, 74.0060° W (Active)"
  });

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [warningData, setWarningData] = useState({
    level: "WARNING", // SAFE, WARNING, CRITICAL
    message: "Evacuee is currently located in a Flood Zone B. Immediate allocation required."
  });

  const [householdMembers, setHouseholdMembers] = useState<{name: string, age: number | "", details: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evacuees, setEvacuees] = useState<any[]>([]);

  const fetchEvacuees = async () => {
    try {
      const res = await fetch("/api/evacuees");
      const data = await res.json();
      if (res.ok) {
        setEvacuees(data.evacuees || []);
      }
    } catch (err) {
      console.error("Failed to fetch evacuees:", err);
    }
  };

  useEffect(() => {
    fetchEvacuees();
  }, []);

  const handleHouseholdSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value) || 1;
    setFormData({ ...formData, householdSize: size });
    
    const targetLength = Math.max(0, size - 1);
    setHouseholdMembers(prev => {
      const newMembers = [...prev];
      if (newMembers.length < targetLength) {
        while (newMembers.length < targetLength) {
          newMembers.push({ name: "", age: "", details: "" });
        }
      } else if (newMembers.length > targetLength) {
        newMembers.splice(targetLength);
      }
      return newMembers;
    });
  };

  const handleMemberChange = (index: number, field: string, value: string | number) => {
    const newMembers = [...householdMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setHouseholdMembers(newMembers);
  };

  const handleLocationSelect = (lat: number, lng: number, name?: string) => {
    let newStatus = "";
    let newWarning = { level: "", message: "" };
    const query = (name || "").toLowerCase();

    if (query.includes("river") || query.includes("flood")) {
      newStatus = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (${name})`;
      newWarning = {
        level: "CRITICAL",
        message: "High risk flood zone detected! Immediate evacuation to a secure shelter required."
      };
    } else if (query.includes("hill") || query.includes("mountain")) {
      newStatus = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (${name})`;
      newWarning = {
        level: "WARNING",
        message: "Landslide risk area. Proceed with caution and monitor weather alerts."
      };
    } else {
      newStatus = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (${name || "Custom Location"})`;
      newWarning = {
        level: "SAFE",
        message: "Location is outside current hazard zones. Normal allocation applies."
      };
    }

    setFormData({ ...formData, gpsStatus: newStatus });
    setWarningData(newWarning);
    setIsMapModalOpen(false);
  };

  const handleRegister = async () => {
    if (!formData.headOfHousehold || !formData.originAddress) {
      alert("Please fill in required fields (Head of Household, Origin Address).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evacuees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          headOfHouseholdAge: Number(formData.headOfHouseholdAge) || 0,
          householdMembers: householdMembers.map(m => ({ ...m, age: Number(m.age) || 0 }))
        })
      });

      if (res.ok) {
        alert("Evacuee registered successfully!");
        setFormData({
          headOfHousehold: "",
          headOfHouseholdAge: "",
          householdSize: 1,
          vulnerability: "",
          originAddress: "",
          gpsStatus: "40.7128° N, 74.0060° W (Active)"
        });
        setHouseholdMembers([]);
        fetchEvacuees();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to register.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-white">Evacuee Management</h1>
          <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-full">
            Level 3 Emergency
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs text-slate-400">
            <div>Last Updated</div>
            <div className="font-mono font-bold text-slate-300">14:22:05 UTC</div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors">
            Dispatch Alert
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registration Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Registration Details</h2>
              <span className="text-sm font-mono text-slate-400">New Registration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Head of Household</label>
                    <input 
                      type="text" 
                      value={formData.headOfHousehold}
                      onChange={(e) => setFormData({...formData, headOfHousehold: e.target.value})}
                      placeholder="Enter full name" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Age</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.headOfHouseholdAge}
                      onChange={(e) => setFormData({...formData, headOfHouseholdAge: e.target.value})}
                      placeholder="Age" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Household Size</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.householdSize}
                      onChange={handleHouseholdSizeChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Vulnerability</label>
                    <input 
                      type="text" 
                      value={formData.vulnerability}
                      onChange={(e) => setFormData({...formData, vulnerability: e.target.value})}
                      placeholder="e.g., Medical / Elderly" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Origin Address</label>
                  <textarea 
                    rows={2} 
                    value={formData.originAddress}
                    onChange={(e) => setFormData({...formData, originAddress: e.target.value})}
                    placeholder="Enter origin address" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                </div>
                
                {/* Dynamic Fields for other household members */}
                {householdMembers.length > 0 && (
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Other Household Members</label>
                    <div className="space-y-3">
                      {householdMembers.map((member, idx) => (
                        <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Member {idx + 1}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={member.name}
                                onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="col-span-1">
                              <input 
                                type="number" 
                                placeholder="Age" 
                                min="0"
                                value={member.age}
                                onChange={(e) => handleMemberChange(idx, "age", e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <input 
                              type="text" 
                              placeholder="Notes/Vulnerability (e.g. Child, Mobility Impaired)" 
                              value={member.details}
                              onChange={(e) => handleMemberChange(idx, "details", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-800">
                  <button 
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSubmitting ? "Registering..." : "Register Family"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Current GPS Status</label>
                  <div 
                    onClick={() => setIsMapModalOpen(true)}
                    className="flex items-center gap-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-blue-500 transition-colors group"
                  >
                    <MapPin className="w-4 h-4 text-blue-500 group-hover:text-blue-400" />
                    <span className="text-slate-300">{formData.gpsStatus}</span>
                  </div>
                </div>
                
                {warningData.level !== "SAFE" ? (
                  <div className={`border rounded-lg p-4 flex gap-3 ${warningData.level === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${warningData.level === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div>
                      <div className={`text-sm font-bold ${warningData.level === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'}`}>Validation Warning</div>
                      <div className={`text-xs mt-1 ${warningData.level === 'CRITICAL' ? 'text-red-500/80' : 'text-yellow-500/80'}`}>{warningData.message}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-400">Location Safe</div>
                      <div className="text-xs text-emerald-500/80 mt-1">{warningData.message}</div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Household Details Overview</label>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• <span className="font-medium text-white">{formData.headOfHousehold || "Unknown"} ({formData.headOfHouseholdAge || "?"})</span> - Primary</li>
                    {householdMembers.map((member, idx) => (
                      <li key={idx}>
                        • <span className="font-medium text-white">{member.name || `Member ${idx + 1}`} ({member.age || "?"})</span> 
                        {member.details && ` - ${member.details}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Registered Family List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-6 min-w-max gap-4">
              <h2 className="text-lg font-bold text-white">Registered Family List</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">Recent</button>
                <button className="px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">Vulnerable</button>
              </div>
            </div>

            <table className="w-full text-sm text-left min-w-[600px]">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-semibold">Case ID</th>
                  <th className="pb-3 font-semibold">Head of Household</th>
                  <th className="pb-3 font-semibold text-center">Size</th>
                  <th className="pb-3 font-semibold">Vulnerability</th>
                  <th className="pb-3 font-semibold">Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {evacuees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No registered families yet.</td>
                  </tr>
                ) : evacuees.map(evacuee => (
                  <tr key={evacuee._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-blue-400">{evacuee.caseId}</td>
                    <td className="py-4 text-white font-bold">{evacuee.headOfHousehold} <span className="text-slate-400 font-normal text-xs">({evacuee.headOfHouseholdAge})</span></td>
                    <td className="py-4 text-white text-center font-bold">{evacuee.householdSize}</td>
                    <td className="py-4 text-slate-300">{evacuee.vulnerability || "-"}</td>
                    <td className="py-4 text-slate-400 truncate max-w-[200px]" title={evacuee.originAddress}>{evacuee.originAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Allocation Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <h2 className="text-left text-lg font-bold text-white mb-6">Allocation Summary</h2>
            
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  className="text-slate-800"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="text-blue-500"
                  strokeDasharray="92, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">92%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-8">Total District Saturation</p>

            <div className="text-left">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase">
                <span>Resources Deployed</span>
                <span className="text-white">84%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>
          </div>

          {/* Audit & Activity Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-6">Audit & Activity Log</h2>
            
            <div className="flex-1 space-y-6 relative before:absolute before:inset-0 before:ml-2 md:before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-800">
              
              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-3 h-3 mt-1.5 rounded-full border border-slate-900 bg-blue-500 relative z-10 shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-white">Case Opened</div>
                  <div className="text-xs text-slate-400 mt-0.5">14:15:22 - Officer J. Smith</div>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-3 h-3 mt-1.5 rounded-full border border-slate-900 bg-blue-500 relative z-10 shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-white">GPS Coordinates Synced</div>
                  <div className="text-xs text-slate-400 mt-0.5">14:16:05 - System Auto</div>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-3 h-3 mt-1.5 rounded-full border border-slate-900 bg-red-500 relative z-10 shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-red-400">Medical Alert Flagged</div>
                  <div className="text-xs text-slate-400 mt-0.5">14:18:40 - Data Validation</div>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-3 h-3 mt-1.5 rounded-full border border-slate-900 bg-slate-600 relative z-10 shrink-0"></div>
                <div>
                  <div className="text-sm font-medium text-slate-500">Pending Allocation...</div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors">
                CONFIRM ALLOCATION
              </button>
              <button className="w-full bg-slate-800 border border-slate-700 text-white font-bold py-3 rounded-xl text-sm hover:bg-slate-700 transition-colors">
                SAVE DRAFT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Selection Modal */}
      {isMapModalOpen && (
        <MapSelector 
          onLocationSelect={handleLocationSelect} 
          onClose={() => setIsMapModalOpen(false)} 
        />
      )}
    </div>
  );
}
