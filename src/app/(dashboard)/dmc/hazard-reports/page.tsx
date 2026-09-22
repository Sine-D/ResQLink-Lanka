"use client";

import React, { useEffect, useState } from "react";
import { FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";

export default function DmcHazardReportsPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/hazard-reports")
      .then((res) => res.json())
      .then((data) => setReports(data.reports || []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-amber-500" />
          Hazard Reports Queue (Member 2 Stub)
        </h1>
        <p className="text-xs text-slate-400 mt-1">Review citizen-submitted hazard reports</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
            <tr>
              <th className="p-4">Hazard Type</th>
              <th className="p-4">Location</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {reports.map((r) => (
              <tr key={r.reportId}>
                <td className="p-4 font-bold">{r.hazardType}</td>
                <td className="p-4">{r.locationName}</td>
                <td className="p-4">{r.description}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]">
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
