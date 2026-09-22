import { ITelemetryRepository } from "../../domain/repositories/ITelemetryRepository";
import { TelemetryReading } from "../../domain/entities/Telemetry";
import TelemetryModel from "../db/models/TelemetryModel";

export class MongoTelemetryRepository implements ITelemetryRepository {
  async save(reading: TelemetryReading): Promise<TelemetryReading> {
    const doc = await TelemetryModel.create({
      sensorId: reading.sensorId,
      districtName: reading.districtName,
      hazardType: reading.hazardType,
      metricName: reading.metricName,
      metricValue: reading.metricValue,
      unit: reading.unit,
      status: reading.status,
      timestamp: reading.timestamp || new Date(),
    });

    return {
      id: doc._id.toString(),
      sensorId: doc.sensorId,
      districtName: doc.districtName,
      hazardType: doc.hazardType as any,
      metricName: doc.metricName,
      metricValue: doc.metricValue,
      unit: doc.unit,
      status: doc.status as any,
      timestamp: doc.timestamp,
    };
  }

  async findBySensorId(sensorId: string, limit = 50): Promise<TelemetryReading[]> {
    const docs = await TelemetryModel.find({ sensorId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return docs.map((doc) => ({
      id: doc._id.toString(),
      sensorId: doc.sensorId,
      districtName: doc.districtName,
      hazardType: doc.hazardType as any,
      metricName: doc.metricName,
      metricValue: doc.metricValue,
      unit: doc.unit,
      status: doc.status as any,
      timestamp: doc.timestamp,
    }));
  }

  async findLatestByDistrict(districtName: string): Promise<TelemetryReading[]> {
    const docs = await TelemetryModel.find({ districtName })
      .sort({ timestamp: -1 })
      .limit(20);

    return docs.map((doc) => ({
      id: doc._id.toString(),
      sensorId: doc.sensorId,
      districtName: doc.districtName,
      hazardType: doc.hazardType as any,
      metricName: doc.metricName,
      metricValue: doc.metricValue,
      unit: doc.unit,
      status: doc.status as any,
      timestamp: doc.timestamp,
    }));
  }
}
