"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
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
  TriangleAlert,
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
  const [locationMode, setLocationMode] = useState<"GPS" | "MANUAL">("GPS");
  const [manualLocation, setManualLocation] = useState("");
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "offline";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ hazardType: "Flood", description: "" });

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
          1: "Location permission was denied. Please allow location access and try again.",
          2: "Your current position is unavailable. Check that location services are enabled.",
          3: "Finding your location timed out. Move to an open area and try again.",
        };
        setLocation(null);
        setLocationError(messages[error.code] || "Could not detect your current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const selectedImage = event.target.files?.[0] ?? null;

    if (selectedImage && !["image/jpeg", "image/png", "image/webp"].includes(selectedImage.type)) {
      setFeedback({ type: "error", message: "Please choose a valid image file." });
      event.target.value = "";
      setImage(null);
      return;
    }

    if (selectedImage && selectedImage.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "The evidence photo must be smaller than 5 MB." });
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
    if (locationMode === "GPS" && !location) {
      setFeedback({
        type: "error",
        message: "Please capture your current location or use manual location entry.",
      });
      return;
    }
    if (locationMode === "MANUAL" && manualLocation.trim().length < 3) {
      setFeedback({ type: "error", message: "Please provide your location." });
      return;
    }

    setShowConfirmation(true);
  }

  function resetReportForm() {
    setForm((current) => ({ ...current, description: "" }));
    setLocation(null);
    setManualLocation("");
    setLocationMode("GPS");
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function storeForSynchronization(payload: HazardReportSubmission) {
    await queueHazardReport(payload);
    setFeedback({
      type: "offline",
      message: "You are offline. Your report is saved and will upload automatically when you reconnect.",
    });
    resetReportForm();
  }

  async function submitReport() {
    if (locationMode === "GPS" && !location) return;
    if (locationMode === "MANUAL" && !manualLocation.trim()) return;

    setLoading(true);

    try {
      const photoUrl = image ? await readImageAsDataUrl(image) : undefined;
      const payload: HazardReportSubmission = {
        clientReportId: crypto.randomUUID(),
        hazardType: form.hazardType,
        description: form.description.trim(),
        locationSource: locationMode,
        locationName: locationMode === "GPS" ? "Live GPS location" : manualLocation.trim(),
        ...(locationMode === "GPS" && location ? { coordinates: location } : {}),
        ...(photoUrl ? { photoUrl } : {}),
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
      if (!response.ok) throw new Error(result.error || "Failed to submit the hazard report");

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
    <form onSubmit={reviewReport} className={styles.form}>
      <div className={styles.formHeading}>
        <span className={styles.formHeadingIcon}><TriangleAlert aria-hidden="true" /></span>
        <div>
          <h2>Incident details</h2>
          <p>Tell us what is happening and where.</p>
        </div>
        <span className={styles.requiredNote}><i aria-hidden="true" /> Required fields</span>
      </div>

      <div className={styles.field}>
        <label htmlFor="hazard-type" className={styles.label}>Hazard type <span>Required</span></label>
        <div className={styles.selectWrap}>
          <span className={styles.hazardDot} aria-hidden="true" />
          <select
            id="hazard-type"
            className={`${styles.control} ${styles.select}`}
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
          <ChevronDown className={styles.chevron} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label htmlFor="hazard-description" className={styles.label}>Description <span>Required</span></label>
          <span className={styles.counter}>{form.description.length}/500</span>
        </div>
        <textarea
          id="hazard-description"
          className={`${styles.control} ${styles.textarea}`}
          rows={4}
          maxLength={500}
          required
          placeholder="Describe what you observed, when it started, and whether people or access routes are at risk."
          value={form.description}
          onChange={(event) => {
            setFeedback(null);
            setForm({ ...form, description: event.target.value });
          }}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="evidence-photo" className={styles.label}>Photo evidence <span>Optional</span></label>
        <p className={styles.safetyNote}>
          Only attach a photo if it is safe to do so. Do not approach or remain near a dangerous
          area just to capture evidence.
        </p>
        <label htmlFor="evidence-photo" className={styles.upload}>
          <Camera aria-hidden="true" />
          <span className={styles.uploadTitle}>Add Photo</span>
          <span className={styles.uploadHint}>JPEG, PNG or WebP up to 5 MB</span>
          <input
            id="evidence-photo"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleImage}
            className="sr-only"
          />
        </label>
        {image && (
          <p className={styles.fileSelected}>
            <FileCheck2 aria-hidden="true" />
            <span>{image.name}</span>
            <button
              type="button"
              className={styles.removePhoto}
              onClick={() => {
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Remove selected photo"
            >
              <X aria-hidden="true" />
            </button>
          </p>
        )}
      </div>

      <div className={styles.field}>
        <fieldset className={styles.locationFieldset}>
          <legend className={styles.label}>Location</legend>
          <div className={styles.locationModes}>
            <button
              type="button"
              onClick={() => {
                setLocationMode("GPS");
                setFeedback(null);
              }}
              aria-pressed={locationMode === "GPS"}
              className={`${styles.modeButton} ${locationMode === "GPS" ? styles.modeButtonActive : ""}`}
            >
              Use GPS
            </button>
            <button
              type="button"
              onClick={() => {
                setLocationMode("MANUAL");
                setFeedback(null);
              }}
              aria-pressed={locationMode === "MANUAL"}
              className={`${styles.modeButton} ${locationMode === "MANUAL" ? styles.modeButtonActive : ""}`}
            >
              Enter Manually
            </button>
          </div>
          {locationMode === "GPS" ? (
            <LocationCard
              location={location}
              locating={locating}
              error={locationError}
              onLocate={captureCurrentLocation}
            />
          ) : (
            <input
              id="manual-location"
              className={`${styles.control} ${styles.manualLocation}`}
              type="text"
              minLength={3}
              maxLength={150}
              placeholder="e.g. Near Kelani Bridge, Peliyagoda"
              value={manualLocation}
              onChange={(event) => {
                setFeedback(null);
                setManualLocation(event.target.value);
              }}
            />
          )}
        </fieldset>
      </div>

      {feedback && (
        <div role="status" aria-live="polite" className={`${styles.feedback} ${styles[feedback.type]}`}>
          {feedback.type === "success" ? (
            <CheckCircle2 aria-hidden="true" />
          ) : feedback.type === "offline" ? (
            <WifiOff aria-hidden="true" />
          ) : (
            <AlertCircle aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <button type="submit" disabled={loading} className={styles.submit}>
        <FileCheck2 aria-hidden="true" />
        Review report
      </button>

      {showConfirmation && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="confirm-report-title">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <span className={styles.modalIcon}><ShieldCheck aria-hidden="true" /></span>
                <div>
                  <h2 id="confirm-report-title">Confirm hazard report</h2>
                  <p>Check the information before submitting it to the DMC.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowConfirmation(false)} disabled={loading} className={styles.closeButton} aria-label="Close confirmation">
                <X aria-hidden="true" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <ConfirmationItem label="Hazard type" value={form.hazardType} />
              <ConfirmationItem label="Description" value={form.description.trim()} />
              <ConfirmationItem
                label={locationMode === "GPS" ? "GPS location" : "Manual location"}
                value={locationMode === "GPS" && location
                  ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${Math.round(location.accuracy)} m)`
                  : manualLocation.trim()}
                icon={<MapPin aria-hidden="true" />}
              />
              <ConfirmationItem
                label="Evidence photo"
                value={image ? `${image.name} · ${(image.size / 1024 / 1024).toFixed(2)} MB` : "No photo attached"}
                icon={<Camera aria-hidden="true" />}
              />
            </div>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowConfirmation(false)} disabled={loading} className={styles.secondaryButton}>Edit report</button>
              <button type="button" onClick={submitReport} disabled={loading} className={styles.confirmButton}>
                <Send aria-hidden="true" />
                {loading ? "Submitting..." : navigator.onLine ? "Confirm and submit" : "Save for synchronization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function ConfirmationItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className={styles.confirmItem}>
      <p className={styles.confirmLabel}>{icon}{label}</p>
      <p className={styles.confirmValue}>{value}</p>
    </div>
  );
}
