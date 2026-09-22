import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="font-bold text-base">ResQLink Lanka</span>
          </div>
          <p className="leading-relaxed text-slate-500">
            Smart Early-Warning & Emergency Coordination Platform powered by Next.js 14, GeoJSON geofencing, and automated SMS/PUSH broadcasts.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3">System Modules</h4>
          <ul className="space-y-2">
            <li><Link href="/dmc/warnings" className="hover:text-red-400">1. Disaster Warning & Alerts (Full)</Link></li>
            <li><Link href="/citizen/report-hazard" className="hover:text-red-400">2. Citizen Hazard Reporting (Stub)</Link></li>
            <li><Link href="/district-officer/incidents" className="hover:text-red-400">3. Rescue Team Dispatch (Stub)</Link></li>
            <li><Link href="/dmc/relief-resources" className="hover:text-red-400">4. Relief Distribution (Stub)</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3">Emergency Contacts</h4>
          <ul className="space-y-2">
            <li>DMC Hotline: 117</li>
            <li>Police Emergency: 119</li>
            <li>Ambulance Service: 1990</li>
            <li>Fire & Rescue: 110</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3">Academic Disclaimer</h4>
          <p className="leading-relaxed text-slate-500">
            SE3070 Coursework Assignment A02 Deliverable. Built strictly for demonstration and academic evaluation purposes.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900 text-center text-slate-600">
        © 2026 ResQLink Lanka Emergency Coordination System. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
