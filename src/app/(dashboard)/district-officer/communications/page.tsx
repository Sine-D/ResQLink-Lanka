"use client";

import React, { useState } from "react";
import { 
  MessageSquare, Radio, ShieldAlert, Phone, MapPin, 
  Image as ImageIcon, Send, MoreVertical, Search, CheckCheck, 
  Clock, User, BellRing, ChevronRight, AlertTriangle 
} from "lucide-react";

// Mock Data
const contacts = [
  { id: 1, name: "Navy Boat 04", type: "Rescue Unit", status: "online", lastMsg: "Approaching target location", time: "10:42 AM", unread: 2 },
  { id: 2, name: "Army Alpha Squad", type: "Rescue Unit", status: "online", lastMsg: "Evacuation successful", time: "10:15 AM", unread: 0 },
  { id: 3, name: "Kotamulla Temple", type: "Shelter", status: "online", lastMsg: "We need more medical supplies", time: "09:30 AM", unread: 0 },
  { id: 4, name: "Ferguson High", type: "Shelter", status: "offline", lastMsg: "Generator is running low on fuel", time: "08:12 AM", unread: 0 },
  { id: 5, name: "National HQ (Colombo)", type: "Command", status: "online", lastMsg: "Status update requested", time: "Yesterday", unread: 0 },
];

const sosFeed = [
  { id: 101, title: "Trapped on Roof", location: "Ratnapura Town", time: "2 mins ago", level: "CRITICAL" },
  { id: 102, title: "Medical Emergency", location: "Kuruwita", time: "15 mins ago", level: "HIGH" },
  { id: 103, title: "Food Shortage", location: "Shelter ID-004", time: "1 hr ago", level: "WARNING" },
];

export default function CommunicationsPage() {
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [message, setMessage] = useState("");

  return (
    <div className="h-full flex flex-col space-y-4 pb-6">
      {/* Top Section: Header & Broadcast */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            Communications Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage dispatch, shelters, and emergency alerts</p>
        </div>
        
        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <Radio className="w-4 h-4" />
          MASS BROADCAST ALERT
        </button>
      </div>

      {/* Main Content Split View */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        
        {/* Left Sidebar: Contacts List */}
        <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search units or shelters..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer">All</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-slate-700">Rescue</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-slate-700">Shelters</span>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {contacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors ${
                  activeContact.id === contact.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                        {contact.type === 'Rescue Unit' ? <ShieldAlert className="w-5 h-5 text-emerald-400" /> : <User className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${contact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{contact.name}</h3>
                      <p className="text-[10px] text-blue-400 font-semibold uppercase mt-0.5">{contact.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">{contact.time}</span>
                    {contact.unread > 0 && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 truncate pr-6">{contact.lastMsg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Active Chat Window */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex justify-between items-center shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center relative">
                {activeContact.type === 'Rescue Unit' ? <ShieldAlert className="w-6 h-6 text-emerald-400" /> : <User className="w-6 h-6 text-slate-400" />}
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${activeContact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{activeContact.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-400 font-semibold uppercase">{activeContact.type}</span>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-xs text-slate-400">{activeContact.status === 'online' ? 'Online on Radio & GPS' : 'Offline'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="Voice Call">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="View on Map">
                <MapPin className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B1120] space-y-6">
            <div className="flex justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Today</span>
            </div>

            {/* Received Message */}
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3 text-sm text-slate-200">
                  We have reached the coordinates. Flood levels are rising fast. Requesting immediate extraction for 5 civilians.
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">10:35 AM</span>
                </div>
              </div>
            </div>

            {/* Sent Message */}
            <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="bg-blue-600 rounded-2xl rounded-tr-none p-3 text-sm text-white shadow-lg shadow-blue-500/20">
                  Understood. Dispatching Helicopter unit to your location. ETA 15 minutes. Secure the high ground.
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">10:36 AM</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Location Share (Received) */}
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-1 text-sm text-slate-200 overflow-hidden">
                  <div className="h-32 w-full bg-slate-900 flex items-center justify-center relative">
                    <MapPin className="w-8 h-8 text-red-500 absolute z-10" />
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at center, #3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                  </div>
                  <div className="p-3">
                    <div className="font-bold">Extraction Point Alpha</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">6.6828° N, 80.3993° E</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">10:42 AM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
            <div className="flex items-end gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-blue-500 transition-colors">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0">
                <MapPin className="w-5 h-5" />
              </button>
              <textarea 
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message or command..." 
                className="w-full bg-transparent text-sm text-white px-2 py-2.5 focus:outline-none resize-none max-h-32"
                style={{ minHeight: '44px' }}
              />
              <button className={`p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center ${message.trim() ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 text-slate-500'}`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center mt-2 px-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Encrypted Radio Network
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Press Enter to send</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: SOS Feed */}
        <div className="w-full lg:w-72 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-red-500/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-red-500" />
              Live SOS Feed
            </h3>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">3 NEW</span>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {sosFeed.map((sos) => (
              <div key={sos.id} className="bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-xl p-3 cursor-pointer transition-all group relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${sos.level === 'CRITICAL' ? 'bg-red-500' : sos.level === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                <div className="pl-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-black uppercase ${sos.level === 'CRITICAL' ? 'text-red-400' : sos.level === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {sos.level}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{sos.time}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{sos.title}</h4>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {sos.location}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Monitoring nationwide distress frequencies...</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
