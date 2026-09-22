import { TelemetryReading } from "../entities/Telemetry";

export interface ITelemetryRepository {
  save(reading: TelemetryReading): Promise<TelemetryReading>;
  findBySensorId(sensorId: string, limit?: number): Promise<TelemetryReading[]>;
  findLatestByDistrict(districtName: string): Promise<TelemetryReading[]>;
}
