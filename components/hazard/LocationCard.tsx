import { AlertCircle, LoaderCircle, MapPin } from "lucide-react";
import styles from "./LocationCard.module.css";

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
  const locationText = location
    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
    : locating
      ? "Detecting your location..."
      : "Use my current location";

  return (
    <div>
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        className={styles.locationButton}
        aria-describedby={error ? "location-error" : undefined}
      >
        {locating ? (
          <LoaderCircle className={styles.spinner} aria-hidden="true" />
        ) : (
          <MapPin aria-hidden="true" />
        )}
        <span>{locationText}</span>
      </button>

      {error && (
        <p id="location-error" role="alert" className={styles.error}>
          <AlertCircle aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
