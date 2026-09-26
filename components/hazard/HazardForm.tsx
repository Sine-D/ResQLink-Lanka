"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  MapPin,
  Send,
  ShieldCheck,
  WifiOff,
  X,
} from "lucide-react";
import LocationCard, { GpsLocation } from "./LocationCard";
import styles from "./HazardForm.module.css";
import {
  HazardReportSubmission,
  queueHazardReport,
} from "@/lib/offline/hazardReportQueue";

export default function HazardForm() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "offline";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    hazardType: "Flood",
    description: "",
  });

  function captureCurrentLocation() {
    setFeedback(null);
    setLocationError("");

    if (!("geolocation" in navigator)) {
      setLocationError("GPS location is not supported by this browser or device.");
      return;
    }

    if (!window.isSecureContext) {
      setLocationError("GPS access requires a secure HTTPS connection.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationError("");
        setLocating(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Please allow location access in your browser and try again.",
          2: "Your current position is unavailable. Check that GPS or location services are enabled.",
          3: "Finding your location timed out. Move to an open area and try again.",
        };
        setLocation(null);
        setLocationError(messages[error.code] || "Could not detect your current location.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const selectedImage = event.target.files?.[0] ?? null;

    if (selectedImage && !selectedImage.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Please choose a valid image file." });
      event.target.value = "";
      setImage(null);
      return;
    }

    if (selectedImage && selectedImage.size > 3 * 1024 * 1024) {
      setFeedback({ type: "error", message: "The evidence photo must be smaller than 3 MB." });
      event.target.value = "";
      setImage(null);
      return;
    }

    setFeedback(null);
    setImage(selectedImage);
  }

  function readImageAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read the selected photo"));
      reader.readAsDataURL(file);
    });
  }

  function reviewReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.description.trim() || !form.hazardType) {
      setFeedback({ type: "error", message: "Please complete all required fields." });
      return;
    }

    if (!location) {
      setFeedback({ type: "error", message: "Please capture your current GPS location before submitting." });
      return;
    }

    if (!image) {
      setFeedback({ type: "error", message: "Please capture or choose an evidence photo." });
      return;
    }

    setShowConfirmation(true);
  }

  function resetReportForm() {
    setForm((current) => ({ ...current, description: "" }));
    setLocation(null);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function storeForSynchronization(payload: HazardReportSubmission) {
    await queueHazardReport(payload);
    setFeedback({
      type: "offline",
      message: "No network connection. Your report is stored safely with Pending Synchronization status and will upload automatically when you are online.",
    });
    resetReportForm();
  }

  async function submitReport() {
    if (!location || !image) return;

    setLoading(true);

    try {
      const photoUrl = image ? await readImageAsDataUrl(image) : "";
      const payload: HazardReportSubmission = {
        clientReportId: crypto.randomUUID(),
        hazardType: form.hazardType,
        description: form.description.trim(),
        locationName: "Live GPS location",
        coordinates: location,
        photoUrl,
      };

      if (!navigator.onLine) {
        await storeForSynchronization(payload);
        setShowConfirmation(false);
        return;
      }

      let response: Response;
      try {
        response = await fetch("/api/hazard-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        await storeForSynchronization(payload);
        setShowConfirmation(false);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit the hazard report");
      }

      setFeedback({
        type: "success",
        message: `Report submitted successfully. Reference: ${result.report.reportId}`,
      });
      resetReportForm();
      setShowConfirmation(false);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Submission failed. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={reviewReport}
      className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 sm:p-8"
    >
      <div className="mb-7 border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold text-white">Hazard details</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Fields marked with an asterisk (*) are required.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-slate-200">Report location</label>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Required</span>
          </div>
          <LocationCard
            location={location}
            locating={locating}
            error={locationError}
            onLocate={captureCurrentLocation}
          />
        </div>

        <div>
          <label htmlFor="hazard-type" className="mb-2 block text-sm font-semibold text-slate-200">
            Hazard type <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              id="hazard-type"
              className={`${styles.control} w-full appearance-none rounded-xl border border-slate-700 px-4 py-3 pr-11 text-sm font-medium outline-none transition hover:border-slate-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10`}
              value={form.hazardType}
              onChange={(event) => {
                setFeedback(null);
                setForm({ ...form, hazardType: event.target.value });
              }}
            >
              <option>Flood</option>
              <option>Landslide</option>
              <option>Tsunami</option>
              <option>Storm</option>
              <option>Fire</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="hazard-description" className="text-sm font-semibold text-slate-200">
              Description <span className="text-red-400">*</span>
            </label>
            <span className="text-xs text-slate-500">{form.description.length}/500</span>
          </div>
          <textarea
            id="hazard-description"
            className={`${styles.control} min-h-36 w-full resize-y rounded-xl border border-slate-700 px-4 py-3 text-sm leading-6 outline-none transition hover:border-slate-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10`}
            rows={5}
            maxLength={500}
            placeholder="Describe what you can see, the severity, and any immediate danger..."
            value={form.description}
            onChange={(event) => {
              setFeedback(null);
              setForm({ ...form, description: event.target.value });
            }}
          />
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Do not put yourself at risk to collect more information.
          </p>
        </div>

        <div>
          <label htmlFor="evidence-photo" className="mb-2 block text-sm font-semibold text-slate-200">
            Evidence photo <span className="text-red-400">*</span>
          </label>
          <label
            htmlFor="evidence-photo"
            className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-5 py-7 text-center transition hover:border-red-500/60 hover:bg-red-500/5 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10"
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition group-hover:bg-red-500/10 group-hover:text-red-400">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-slate-200">Choose a photo</span>
            <span className="mt-1 text-xs text-slate-500">PNG, JPG or WEBP from your device</span>
            <input
              id="evidence-photo"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImage}
              className="sr-only"
            />
          </label>

          {image && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-300">
              <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{image.name}</span>
            </p>
          )}
        </div>

        {feedback && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : feedback.type === "offline"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : feedback.type === "offline" ? (
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:from-red-500 hover:to-orange-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Review report details
        </button>

        <Link
          href="/citizen/hazard-reports"
          className="flex w-full items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        >
          View my submitted reports
        </Link>
      </div>

      {showConfirmation && location && image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-report-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="confirm-report-title" className="text-lg font-bold text-white">Confirm hazard report</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Check the information before submitting it to the DMC.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                aria-label="Close confirmation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
              <ConfirmationItem label="Hazard type" value={form.hazardType} />
              <ConfirmationItem label="Description" value={form.description.trim()} />
              <ConfirmationItem
                label="GPS location"
                value={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${Math.round(location.accuracy)} m)`}
                icon={<MapPin className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
              />
              <ConfirmationItem
                label="Evidence photo"
                value={`${image.name} · ${(image.size / 1024 / 1024).toFixed(2)} MB`}
                icon={<Camera className="h-4 w-4 text-sky-400" aria-hidden="true" />}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-950/40 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                Edit report
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:from-red-500 hover:to-orange-500 disabled:cursor-wait disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {loading ? "Submitting..." : navigator.onLine ? "Confirm and submit" : "Save for synchronization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function ConfirmationItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}
