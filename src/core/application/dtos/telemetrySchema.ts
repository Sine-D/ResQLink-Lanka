import { z } from "zod";

export const telemetryReadingSchema = z.object({
  sensorId: z.string().min(1, "Sensor ID is required"),
  districtName: z.string().min(1, "District name is required"),
  hazardType: z.enum([
    "Flood",
    "Landslide",
    "Cyclone",
    "Tsunami",
    "Drought",
    "FlashFlood",
  ]),
  metricName: z.string().min(1, "Metric name is required"),
  metricValue: z.number(),
  unit: z.string().default("m"),
});

export type IngestTelemetryInput = z.infer<typeof telemetryReadingSchema>;
