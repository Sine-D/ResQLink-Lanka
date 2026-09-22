import { ITelemetryRepository } from "../../domain/repositories/ITelemetryRepository";
import { TelemetryReading } from "../../domain/entities/Telemetry";
import { eventBus } from "../../infrastructure/event-bus/EventBus";
import { TelemetryReceivedEvent } from "../../domain/events/DomainEvent";
import { IngestTelemetryInput } from "../dtos/telemetrySchema";
import { evaluateTelemetryStatus } from "../event-handlers/TelemetryEventHandler";

export class IngestTelemetryUseCase {
  constructor(private telemetryRepo: ITelemetryRepository) {}

  async execute(input: IngestTelemetryInput): Promise<TelemetryReading> {
    const evalResult = evaluateTelemetryStatus(input.metricName, input.metricValue);

    const reading: TelemetryReading = {
      sensorId: input.sensorId,
      districtName: input.districtName,
      hazardType: input.hazardType as any,
      metricName: input.metricName,
      metricValue: input.metricValue,
      unit: input.unit || "m",
      status: evalResult.status,
      timestamp: new Date(),
    };

    const saved = await this.telemetryRepo.save(reading);

    // Publish EDA event
    const event = new TelemetryReceivedEvent({
      sensorId: saved.sensorId,
      districtName: saved.districtName,
      hazardType: saved.hazardType,
      metricName: saved.metricName,
      metricValue: saved.metricValue,
      unit: saved.unit,
      timestamp: saved.timestamp,
    });

    eventBus.publish(event);

    return saved;
  }
}

export class GetLatestTelemetryUseCase {
  constructor(private telemetryRepo: ITelemetryRepository) {}

  async execute(districtName?: string, sensorId?: string): Promise<TelemetryReading[]> {
    if (sensorId) {
      return this.telemetryRepo.findBySensorId(sensorId);
    }
    if (districtName) {
      return this.telemetryRepo.findLatestByDistrict(districtName);
    }
    return this.telemetryRepo.findLatestByDistrict("Colombo");
  }
}
