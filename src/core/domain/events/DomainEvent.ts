export interface IDomainEvent<T = any> {
  eventId: string;
  eventName: string;
  occurredOn: Date;
  payload: T;
}

export abstract class DomainEvent<T = any> implements IDomainEvent<T> {
  public readonly eventId: string;
  public readonly occurredOn: Date;

  constructor(
    public readonly eventName: string,
    public readonly payload: T
  ) {
    this.eventId = `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.occurredOn = new Date();
  }
}

export class WarningIssuedEvent extends DomainEvent<{
  warningId: string;
  hazardType: string;
  severity: string;
  districtName: string;
  instructions: string;
  issuedBy: string;
}> {
  static readonly EVENT_NAME = "WarningIssuedEvent";
  constructor(payload: {
    warningId: string;
    hazardType: string;
    severity: string;
    districtName: string;
    instructions: string;
    issuedBy: string;
  }) {
    super(WarningIssuedEvent.EVENT_NAME, payload);
  }
}

export class TelemetryReceivedEvent extends DomainEvent<{
  sensorId: string;
  districtName: string;
  hazardType: string;
  metricName: string;
  metricValue: number;
  unit: string;
  timestamp: Date;
}> {
  static readonly EVENT_NAME = "TelemetryReceivedEvent";
  constructor(payload: {
    sensorId: string;
    districtName: string;
    hazardType: string;
    metricName: string;
    metricValue: number;
    unit: string;
    timestamp: Date;
  }) {
    super(TelemetryReceivedEvent.EVENT_NAME, payload);
  }
}

export class TelemetryAlertTriggeredEvent extends DomainEvent<{
  sensorId: string;
  districtName: string;
  hazardType: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  metricValue: number;
  thresholdValue: number;
}> {
  static readonly EVENT_NAME = "TelemetryAlertTriggeredEvent";
  constructor(payload: {
    sensorId: string;
    districtName: string;
    hazardType: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    reason: string;
    metricValue: number;
    thresholdValue: number;
  }) {
    super(TelemetryAlertTriggeredEvent.EVENT_NAME, payload);
  }
}
