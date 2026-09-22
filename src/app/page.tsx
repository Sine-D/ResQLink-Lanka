import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import {
  ShieldAlert,
  Radio,
  FileSpreadsheet,
  Truck,
  Boxes,
  ArrowRight,
  CheckCircle2,
  Send,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1),transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold tracking-wide uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>National Early-Warning Network Active</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Rapid Disaster Warning & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Emergency Coordination</span> Platform
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Geofenced disaster alerts, citizen hazard reports, rescue team dispatches, and emergency relief resource management in one centralized system.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dmc/warnings"
              className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>DMC Warnings Dashboard</span>
            </Link>

            <Link
              href="/citizen/alerts"
              className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <span>View Active Citizen Alerts</span>
              <ArrowRight className="w-4 h-4 text-red-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-black text-white">The 4 System Pillars</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Integrated end-to-end disaster emergency response modules designed per Sri Lanka DMC guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 - Full */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-red-950/30 to-slate-900 border border-red-500/40 relative group overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/30">
              <Radio className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500 text-white inline-block mb-2">
              Full Module (Member 1)
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Disaster Warning & Alerts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              GIS map polygon geofencing, population density reach estimation, Zod schema validation, and automated SMS/PUSH dispatches with retry handling.
            </p>
          </div>

          {/* Pillar 2 - Stub */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 inline-block mb-2">
              Module 2 (Stub)
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Citizen Hazard Reporting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Geolocated citizen hazard reports with photo attachments and DMC officer verification queues.
            </p>
          </div>

          {/* Pillar 3 - Stub */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 inline-block mb-2">
              Module 3 (Stub)
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Rescue Team Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Emergency incident mapping and district rescue team assignment workflows.
            </p>
          </div>

          {/* Pillar 4 - Stub */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <Boxes className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 inline-block mb-2">
              Module 4 (Stub)
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Relief Distribution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Central warehouse stock management and distribution logging for affected citizens.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-black text-white">How The Warning System Works</h2>
            <p className="text-slate-400 text-sm">Step-by-step workflow from DMC draft creation to broadcast delivery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center mx-auto mb-3">1</div>
              <h4 className="font-bold text-white text-sm">Create Warning Draft</h4>
              <p className="text-xs text-slate-400">DMC Officer selects hazard type, severity, and draws target district geofenced polygon.</p>
            </div>

            <div className="p-4 space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center mx-auto mb-3">2</div>
              <h4 className="font-bold text-white text-sm">Review & Estimate Reach</h4>
              <p className="text-xs text-slate-400">System calculates estimated population reach using static district density matrix.</p>
            </div>

            <div className="p-4 space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center mx-auto mb-3">3</div>
              <h4 className="font-bold text-white text-sm">Publish & Persist State</h4>
              <p className="text-xs text-slate-400">Target area coverage validated, warning persisted as ACTIVE before triggering gateway.</p>
            </div>

            <div className="p-4 space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center mx-auto mb-3">4</div>
              <h4 className="font-bold text-white text-sm">Broadcast & Delivery Retry</h4>
              <p className="text-xs text-slate-400">Alerts sent via SMS/PUSH gateway; failed or pending dispatches surfaced for retry.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Contact Disaster Management Center</h2>
            <p className="text-xs text-slate-400">Send an inquiry or system feedback to the DMC technical coordination team</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you! Your message has been recorded.");
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruwan Perera"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="ruwan@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
              <textarea
                rows={3}
                required
                placeholder="Write your message or inquiry here..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
            >
              <Send className="w-4 h-4" />
              <span>Send Contact Message</span>
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
