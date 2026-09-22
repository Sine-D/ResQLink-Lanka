import React from "react";
import { AlertTriangle, MapPin, Clock, ShieldAlert, ArrowRight } from "lucide-react";
import WarningStatusBadge from "./WarningStatusBadge";

export interface CitizenAlertCardProps {
  warning: {
    warningId: string;
    hazardType: string;
    severity: string;
    targetArea: {
      districtName: string;
      estimatedReach?: number;
    };
    instructions: string;
    validFrom: string | Date;
    validUntil: string | Date;
    createdAt: string | Date;
  };
}

export const CitizenAlertCard: React.FC<CitizenAlertCardProps> = ({ warning }) => {
  const isCritical = warning.severity === "Critical" || warning.severity === "High";

  const instructionsList = warning.instructions
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 shadow-lg overflow-hidden ${
        isCritical
          ? "border-red-500/40 bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-900 text-white"
          : "border-amber-500/40 bg-slate-900 text-white"
      }`}
    >
      {/* High-priority Emergency Header Banner */}
      <div
        className={`px-6 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
          isCritical ? "bg-red-600 text-white" : "bg-amber-600 text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 animate-bounce" />
          <span>OFFICIAL EMERGENCY DISASTER ALERT</span>
        </div>
        <WarningStatusBadge status={warning.severity.toUpperCase()} type="warning" />
      </div>

      <div className="p-6 space-y-4">
        {/* Title & District */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <AlertTriangle
                className={`w-6 h-6 ${isCritical ? "text-red-400" : "text-amber-400"}`}
              />
              {warning.hazardType} Warning
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <MapPin className="w-4 h-4 text-red-400" />
                {warning.targetArea.districtName} District
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                Issued: {new Date(warning.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Safety Instructions */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Mandatory Safety Instructions:
          </h4>
          <ul className="space-y-1.5 text-sm text-slate-200 list-disc list-inside">
            {instructionsList.map((instruction, idx) => (
              <li key={idx} className="leading-relaxed">
                {instruction}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800">
          <span className="text-slate-400">
            Valid until: <strong className="text-slate-200">{new Date(warning.validUntil).toLocaleString()}</strong>
          </span>

          <a
            href="#shelters"
            onClick={(e) => {
              e.preventDefault();
              alert(`Navigating to designated emergency shelters in ${warning.targetArea.districtName} district.`);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-all shadow-md hover:shadow-red-600/30"
          >
            <span>View Designated Shelters</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default CitizenAlertCard;
