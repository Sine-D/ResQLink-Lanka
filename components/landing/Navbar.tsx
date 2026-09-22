"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, UserCheck } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export const Navbar: React.FC = () => {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">ResQLink</span>
            <span className="text-xs font-bold text-red-500 block -mt-1 tracking-wider uppercase">Lanka Emergency</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/about" className="hover:text-white transition-colors">About System</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href={
                  (session.user as { role?: string }).role === "DMC_OFFICER"
                    ? "/dmc/warnings"
                    : (session.user as { role?: string }).role === "DISTRICT_OFFICER"
                    ? "/district-officer/incidents"
                    : "/citizen/alerts"
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-red-600/30 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Dashboard ({session.user.name?.split(" ")[0]})</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-semibold transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-all"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
