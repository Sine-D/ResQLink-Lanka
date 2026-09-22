import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-8 flex-1">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">About ResQLink Lanka</h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Smart Disaster Early-Warning & Emergency Coordination System built for SE3070 Coursework Assignment A02.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-sm text-slate-300 leading-relaxed">
          <h3 className="text-lg font-bold text-white">System Objective</h3>
          <p>
            ResQLink Lanka is designed to bridge critical gaps between disaster management authorities and citizens during rapid-onset natural disasters such as floods, landslides, cyclones, and tsunamis across Sri Lanka.
          </p>

          <h3 className="text-lg font-bold text-white pt-4">Module Implementation Scope</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-500 mt-1 shrink-0" />
              <span><strong>Member 1 (Fully Implemented):</strong> Issue Location-Based Disaster Warning. Includes Zod validation schemas, Leaflet GIS polygon geofencing, population density reach calculation, publish order persistence, and notification retry handling.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
              <span><strong>Member 2 (Stub):</strong> Hazard Reporting module scaffold with photo attachment schema and verification workflow notes.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
              <span><strong>Member 3 (Stub):</strong> Rescue Team Dispatch module scaffold with incident model and team assignment endpoint.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
              <span><strong>Member 4 (Stub):</strong> Relief Resource Distribution module scaffold with stock inventory model and distribution log endpoint.</span>
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
