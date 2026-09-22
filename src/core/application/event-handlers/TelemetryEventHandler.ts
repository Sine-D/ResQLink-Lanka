import { eventBus } from "../../infrastructure/event-bus/EventBus";
import { TelemetryReceivedEvent, TelemetryAlertTriggeredEvent } from "../../domain/events/DomainEvent";

// Defined sensor alert thresholds for automated disaster warnings
const SENSOR_THRESHOLDS: Record<string, { warning: number; critical: number }> = {
  water_level_m: { warning: 6.0, critical: 8.5 },
  rainfall_mm: { warning: 75.0, critical: 150.0 },
  tilt_degrees: { warning: 5.0, critical: 12.0 },
};

export function evaluateTelemetryStatus(
  metricName: string,
  value: number
): { status: "NORMAL" | "WARNING" | "CRITICAL"; threshold?: number } {
  const threshold = SENSOR_THRESHOLDS[metricName];
  if (!threshold) return { status: "NORMAL" };

  if (value >= threshold.critical) {
    return { status: "CRITICAL", threshold: threshold.critical };
  }
  if (value >= threshold.warning) {
    return { status: "WARNING", threshold: threshold.warning };
  }
  return { status: "NORMAL" };
}

export function registerTelemetryEventHandlers(): void {
  eventBus.subscribe<TelemetryReceivedEvent>(
    TelemetryReceivedEvent.EVENT_NAME,
    async (event) => {
      const { sensorId, districtName, hazardType, metricName, metricValue } = event.payload;

      const evalResult = evaluateTelemetryStatus(metricName, metricValue);

      if (evalResult.status !== "NORMAL") {
        const severity = evalResult.status === "CRITICAL" ? "Critical" : "High";
        const alertEvent = new TelemetryAlertTriggeredEvent({
          sensorId,
          districtName,
          hazardType,
          severity,
          reason: `Sensor ${sensorId} reading for ${metricName} (${metricValue}) reached ${evalResult.status} threshold (${evalResult.threshold})`,
          metricValue,
          thresholdValue: evalResult.threshold || 0,
        });

        console.warn(
          `[EDA:TelemetryEventHandler] ALERT TRIGGERED: ${alertEvent.payload.reason}`
        );

        eventBus.publish(alertEvent);
      }
    }
  );
}
