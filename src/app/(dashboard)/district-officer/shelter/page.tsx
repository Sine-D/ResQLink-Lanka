"use client";

import React, { useState } from "react";
import { Search, MapPin, Cloud, Bell, AlertTriangle, CheckCircle2, RotateCw, Plus, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dynamic from 'next/dynamic';

const MapSelector = dynamic(() => import('@/components/MapSelector'), { ssr: false });

const chartData = [
  { time: "08:00", occupancy: 3100, capacity: 8400 },
  { time: "10:00", occupancy: 3800, capacity: 8400 },
  { time: "12:00", occupancy: 4200, capacity: 8400 },
  { time: "14:00", occupancy: 4800, capacity: 8400 },
  { time: "16:00", occupancy: 5120, capacity: 8400 },
  { time: "18:00", occupancy: 5300, capacity: 8400 },
  { time: "20:00", occupancy: 5120, capacity: 8400 },
];

export default function ShelterPage() {
  const [evacueeCount, setEvacueeCount] = useState<string>("25");
  const [selectedShelter, setSelectedShelter] = useState<string>("SH-001");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, name: string} | null>(null);

  const handleAddShelter = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 relative pb-12">
      {showMapSelector && (
        <MapSelector 
          onLocationSelect={(lat, lng, name) => {
            setSelectedLocation({ lat, lng, name: name || '' });
            setShowMapSelector(false);
          }}
          onClose={() => setShowMapSelector(false)}
        />
      )}
      {/* Add Shelter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white">Register New Shelter</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddShelter} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Shelter Name</label>
                  <input required type="text" placeholder="e.g. Royal College Main Hall" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location / Address</label>
                  <div className="flex gap-2">
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Colombo 07" 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      value={selectedLocation ? selectedLocation.name : ''}
                      onChange={(e) => setSelectedLocation(prev => prev ? {...prev, name: e.target.value} : {lat: 0, lng: 0, name: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowMapSelector(true)} 
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Map
                    </button>
                  </div>
                  {selectedLocation && selectedLocation.lat !== 0 && (
                     <div className="mt-2 text-xs text-blue-400 flex items-center gap-1.5 font-medium">
                       <CheckCircle2 className="w-3.5 h-3.5" /> 
                       Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                     </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Max Capacity</label>
                    <input required type="number" placeholder="e.g. 500" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contact Phone</label>
                    <input type="text" placeholder="e.g. 0771234567" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contact Person Name</label>
                  <input type="text" placeholder="e.g. Mr. Silva" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Available Facilities</label>
                  <textarea placeholder="e.g. Water, Electricity, Separate Toilets" rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"></textarea>
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end border-t border-slate-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
                >
                  Register Shelter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-white">Shelter Inventory & Allocation</h1>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            Colombo District HQ
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Cloud className="w-4 h-4" />
            Sync Queue: 0
          </div>
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B1120]"></div>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
            <div className="text-right">
              <div className="text-sm font-bold text-white">D. Perera</div>
              <div className="text-xs text-slate-500">District Officer</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold">
              DP
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 mb-1">Total Shelters</div>
          <div className="text-3xl font-black text-white">42</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 mb-1">Available</div>
          <div className="text-3xl font-black text-emerald-400">31</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 mb-1">Full</div>
          <div className="text-3xl font-black text-red-400">11</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 mb-1">Total Capacity</div>
          <div className="text-3xl font-black text-white">8,400</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 mb-1">Current Occupancy</div>
          <div className="text-3xl font-black text-white">5,120</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 mb-1">Available Spaces</div>
          <div className="text-3xl font-black text-blue-400">3,280</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shelter Inventory List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Shelter Inventory List</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search ID or Name..." 
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
                  />
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  All Status
                </button>
                <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Shelter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-800 uppercase">
                    <th className="pb-3 font-semibold">Shelter ID / Name</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Distance</th>
                    <th className="pb-3 font-semibold">Occupancy</th>
                    <th className="pb-3 font-semibold">Capacity</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-white">SH-001 - Central High School</td>
                    <td className="py-4 text-slate-400">Colombo 07</td>
                    <td className="py-4 text-slate-400">0.8 km</td>
                    <td className="py-4 text-white">185</td>
                    <td className="py-4 text-white">200</td>
                    <td className="py-4 font-bold text-orange-400">NEAR CAPACITY</td>
                    <td className="py-4 text-right">
                      <button className="bg-slate-800 border border-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">
                        Allocate
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-white opacity-50">SH-004 - St. Peters Community Hall</td>
                    <td className="py-4 text-slate-400 opacity-50">Dehiwala</td>
                    <td className="py-4 text-slate-400 opacity-50">2.3 km</td>
                    <td className="py-4 text-white opacity-50">200</td>
                    <td className="py-4 text-white opacity-50">200</td>
                    <td className="py-4 font-bold text-red-500 opacity-50">FULL</td>
                    <td className="py-4 text-right">
                      <button className="bg-slate-900 border border-slate-800 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold cursor-not-allowed">
                        Full
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-white">SH-009 - Buddhist Center</td>
                    <td className="py-4 text-slate-400">Nugegoda</td>
                    <td className="py-4 text-slate-400">3.1 km</td>
                    <td className="py-4 text-white">42</td>
                    <td className="py-4 text-white">150</td>
                    <td className="py-4 font-bold text-emerald-400">AVAILABLE</td>
                    <td className="py-4 text-right">
                      <button className="bg-slate-800 border border-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">
                        Allocate
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-white">SH-012 - Municipal Stadium</td>
                    <td className="py-4 text-slate-400">Colombo 03</td>
                    <td className="py-4 text-slate-400">4.5 km</td>
                    <td className="py-4 text-white">120</td>
                    <td className="py-4 text-white">500</td>
                    <td className="py-4 font-bold text-emerald-400">AVAILABLE</td>
                    <td className="py-4 text-right">
                      <button className="bg-slate-800 border border-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">
                        Allocate
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Capacity Utilization Trends */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Capacity Utilization Trends</h2>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-300">Current Occupancy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
                  <span className="text-slate-500">Total Capacity</span>
                </div>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type="monotone" dataKey="capacity" stroke="#334155" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="occupancy" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOccupancy)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column (Side Panels) */}
        <div className="space-y-6">
          
          {/* Real-time Allocation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider z-10">
              Live
            </div>
            
            <h2 className="text-lg font-bold text-white mb-6">Real-time Allocation</h2>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-slate-400">Current Location (GPS)</span>
                <button className="text-xs text-blue-500 hover:text-blue-400 font-semibold flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
              <div className="flex items-center gap-2 text-white font-mono text-sm mb-4">
                <MapPin className="w-4 h-4 text-slate-500" />
                6.9271° N, 79.8612° E
                <span className="text-slate-500 text-xs ml-2">(Accuracy: 5m)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Manual Override</div>
                  <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300">Colombo</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1 opacity-0">.</div>
                  <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300">Colombo 07</div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">1. Select Shelter</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                  value={selectedShelter}
                  onChange={(e) => setSelectedShelter(e.target.value)}
                >
                  <option value="SH-001">SH-001 - Central High School (15 spaces left)</option>
                  <option value="SH-009">SH-009 - Buddhist Center (108 spaces left)</option>
                  <option value="SH-012">SH-012 - Municipal Stadium (380 spaces left)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">2. Evacuee Count</label>
                <input 
                  type="number" 
                  value={evacueeCount}
                  onChange={(e) => setEvacueeCount(e.target.value)}
                  className={`w-full bg-slate-950 border ${parseInt(evacueeCount) > 15 && selectedShelter === 'SH-001' ? 'border-red-500/50 text-red-400' : 'border-slate-800 text-white'} rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500`}
                />
              </div>

              {parseInt(evacueeCount) > 15 && selectedShelter === 'SH-001' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex gap-2 text-red-400 text-sm font-bold mb-1 items-center">
                    <AlertTriangle className="w-4 h-4" />
                    Capacity Exceeded
                  </div>
                  <div className="text-xs text-red-500/80 leading-relaxed">
                    Selected shelter only has 15 spaces remaining. Please allocate the remaining {parseInt(evacueeCount) - 15} evacuees to SH-009.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                  {parseInt(evacueeCount) > 15 && selectedShelter === 'SH-001' ? "Allocate 15 Only" : "Allocate"}
                </button>
              </div>
            </div>
          </div>

          {/* Shelter Proximity Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Shelter Proximity Map</h2>
            <div className="bg-slate-800 rounded-xl h-48 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
              <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 rounded-lg p-2 text-[10px] font-semibold text-slate-300 space-y-1.5 z-10">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Available</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Near Capacity</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Full</div>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded text-[10px] font-bold text-slate-400 z-10">
                Radius: 5.0 km
              </div>
              <span className="text-slate-500 font-medium text-sm z-0">Interactive Map View Placeholder</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-slate-200">SH-012 Allocation Successful</div>
                  <div className="text-xs text-slate-500">45 evacuees added • 10 mins ago</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-2 shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-slate-200">Offline Record Saved</div>
                  <div className="text-xs text-slate-500">SH-009 occupancy updated locally • 1 hr ago</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
