import React from "react";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-8 flex-1">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center mx-auto shadow-xl shadow-red-600/20">
            <Image src="/logo.jpg" alt="ResQLink Lanka Logo" width={64} height={64} className="w-full h-full object-cover" priority />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">About ResQLink Lanka</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-sm text-slate-300 leading-relaxed">
          <h3 className="text-lg font-bold text-white">System Objective</h3>
          <p>
            ResQLink Lanka is designed to bridge critical gaps between disaster management authorities and citizens during rapid-onset natural disasters such as floods, landslides, cyclones, and tsunamis across Sri Lanka.
          </p>

          <h3 className="text-lg font-bold text-white pt-4">Core System Modules</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span><strong>Disaster Warning & Alerts:</strong> Location-based early warnings with GIS map polygon geofencing, population density reach estimation, multi-level severity classification, and automated multi-channel broadcasts with retry handling.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span><strong>Citizen Hazard Reporting:</strong> Real-time crowd-sourced incident reporting with GPS geolocated coordinates, photo evidence attachments, and DMC officer verification and triage queues.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span><strong>Rescue Team Dispatch:</strong> Emergency incident mapping, district rescue unit matching, automated deployment routing, and real-time field mission status tracking.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span><strong>Relief Resource Distribution:</strong> Centralized warehouse supply management, aid inventory allocation, transparent citizen distribution logging, and relief tracking.</span>
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
