import HazardForm from "@/components/hazard/HazardForm";
import { AlertTriangle, Clock3, ShieldCheck } from "lucide-react";

export default function Page() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/20">
        <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                  Citizen safety report
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Report a Hazard
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Share accurate details from your location so emergency teams can assess the danger and respond quickly.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Secure report
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-slate-800 pt-5 text-xs text-slate-400">
            <Clock3 className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Reports are shared with the Disaster Management Center for verification.
          </div>
        </div>
      </header>

      <HazardForm />
    </section>
  );
}
