"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Send } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative -mt-16 min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image - clearly visible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Hero.jpg"
          alt="Disaster Early Warning Background"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Cinematic Overlays: maintains clear storm & city visibility while ensuring text readability */}
        <div className="absolute inset-0 bg-slate-950/35 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15),transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Rapid Disaster Warning & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Emergency Coordination</span> Platform
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Geofenced disaster alerts, citizen hazard reports, rescue team dispatches, and emergency relief resource management in one centralized system.
          </p>
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
