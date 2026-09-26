import { AlertCircle, CheckCircle2, LocateFixed, LoaderCircle, MapPin } from "lucide-react";

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationCardProps {
  location: GpsLocation | null;
  locating: boolean;
  error: string;
  onLocate: () => void;
}

export default function LocationCard({ location, locating, error, onLocate }: LocationCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 transition sm:p-5 ${
        location
          ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5"
          : "border-red-500/20 bg-gradient-to-br from-red-500/10 to-orange-500/5"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
            location
              ? "bg-emerald-500/15 text-emerald-400 ring-emerald-400/20"
              : "bg-red-500/15 text-red-400 ring-red-400/20"
          }`}
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-white">Current GPS location</p>
            {location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Captured
              </span>
            )}
          </div>

          {location ? (
            <div className="mt-2">
              <p className="font-mono text-sm font-semibold text-slate-200">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Accuracy approximately {Math.round(location.accuracy)} metres
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Share your device&apos;s live position so DMC officers can locate the reported hazard accurately.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-xs leading-5 text-red-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            {locating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
            )}
            {locating ? "Finding your location..." : location ? "Update my location" : "Use my current location"}
          </button>
        </div>
      </div>
    </div>
  );
}
