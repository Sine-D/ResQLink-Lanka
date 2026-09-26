"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShieldAlert,
  Radio,
  PlusCircle,
  FileSpreadsheet,
  Truck,
  Boxes,
  Bell,
  LogOut,
  User,
  AlertTriangle,
  ClipboardClock,
} from "lucide-react";
import HazardSyncManager from "@/components/hazard/HazardSyncManager";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role || "DMC_OFFICER";
  const userName = session?.user?.name || "DMC Officer";

  const isDmc = userRole === "DMC_OFFICER";
  const isDistrictOfficer = userRole === "DISTRICT_OFFICER";

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar Nav */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">ResQLink</span>
              <span className="text-[10px] font-bold text-red-500 block -mt-1 tracking-wider">COMMAND CENTER</span>
            </div>
          </Link>

          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {userRole.replace("_", " ")} PORTAL
            </div>

            {/* DMC Officer Menu Items */}
            {isDmc && (
              <>
                <Link
                  href="/dmc/warnings"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dmc/warnings"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>Warnings Dashboard</span>
                  <span className="ml-auto text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-800">
                    FULL
                  </span>
                </Link>

                <Link
                  href="/dmc/warnings/new"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dmc/warnings/new"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Issue New Warning</span>
                  <span className="ml-auto text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-800">
                    FULL
                  </span>
                </Link>

                <Link
                  href="/dmc/hazard-reports"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname.startsWith("/dmc/hazard-reports")
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Hazard Verifications</span>
                  <span className="ml-auto text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-800">
                    FULL
                  </span>
                </Link>

                <Link
                  href="/dmc/relief-resources"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname.startsWith("/dmc/relief-resources")
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>Relief Stock Hub</span>
                  <span className="ml-auto text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    STUB
                  </span>
                </Link>
              </>
            )}

            {/* Citizen Menu Items */}
            {!isDmc && !isDistrictOfficer && (
              <>
                <Link
                  href="/citizen/alerts"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/citizen/alerts"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Emergency Alert Feed</span>
                  <span className="ml-auto text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-800">
                    FULL
                  </span>
                </Link>

                <Link
                  href="/citizen/report-hazard"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/citizen/report-hazard"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Report a Hazard</span>
                  <span className="ml-auto text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-800">
                    FULL
                  </span>
                </Link>

                <Link
                  href="/citizen/hazard-reports"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/citizen/hazard-reports"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <ClipboardClock className="w-4 h-4" />
                  <span>My Hazard Reports</span>
                  <span className="ml-auto text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-800">
                    FULL
                  </span>
                </Link>
              </>
            )}

            {/* District Officer Menu Items */}
            {isDistrictOfficer && (
              <Link
                href="/district-officer/incidents"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname.startsWith("/district-officer")
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Rescue Dispatch</span>
                <span className="ml-auto text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                  STUB
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{userName}</div>
              <div className="text-[10px] text-slate-400 truncate">{userRole}</div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-red-500/10 hover:text-red-400 text-slate-400 border border-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">{children}</main>
      {!isDmc && !isDistrictOfficer && <HazardSyncManager />}
    </div>
  );
}
