export type TelemetryHazardType = "Flood" | "Landslide" | "Cyclone" | "Tsunami" | "Drought" | "FlashFlood";

export interface TelemetryReading {
  id?: string;
  sensorId: string;
  districtName: string;
  hazardType: TelemetryHazardType;
  metricName: string; // e.g. "water_level_m", "rainfall_mm", "tilt_degrees"
  metricValue: number;
  unit: string;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  timestamp: Date;
}
