import React from "react";

interface WarningStatusBadgeProps {
  status: string;
  type?: "warning" | "dispatch";
}

export const WarningStatusBadge: React.FC<WarningStatusBadgeProps> = ({ status, type = "warning" }) => {
  let badgeStyles = "bg-slate-100 text-slate-700 border-slate-300";

  if (type === "warning") {
    switch (status) {
      case "ACTIVE":
        badgeStyles = "bg-red-500/10 text-red-600 border-red-500/30 font-semibold animate-pulse";
        break;
      case "DRAFT":
        badgeStyles = "bg-slate-500/10 text-slate-600 border-slate-400/30";
        break;
      case "EXPIRED":
        badgeStyles = "bg-amber-500/10 text-amber-700 border-amber-500/30";
        break;
    }
  } else {
    // dispatchStatus
    switch (status) {
      case "SENT":
        badgeStyles = "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
        break;
      case "PENDING_DISPATCH":
        badgeStyles = "bg-amber-500/10 text-amber-700 border-amber-500/30";
        break;
      case "FAILED":
        badgeStyles = "bg-red-600/10 text-red-700 border-red-600/30 font-bold";
        break;
      case "NOT_SENT":
        badgeStyles = "bg-slate-200/50 text-slate-500 border-slate-300";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles}`}
    >
      {status}
    </span>
  );
};

export default WarningStatusBadge;
