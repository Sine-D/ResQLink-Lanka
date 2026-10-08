export interface IDomainEvent<T = unknown> {
  eventId: string;
  eventName: string;
  occurredOn: Date;
  payload: T;
}

export abstract class DomainEvent<T = unknown> implements IDomainEvent<T> {
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

export class ResourceAllocatedEvent extends DomainEvent<{
  resourceId: string;
  resourceName: string;
  quantityAllocated: number;
  district: string;
  allocatedBy: string;
}> {
  static readonly EVENT_NAME = "RESOURCE_ALLOCATED";
  constructor(payload: {
    resourceId: string;
    resourceName: string;
    quantityAllocated: number;
    district: string;
    allocatedBy: string;
  }) {
    super(ResourceAllocatedEvent.EVENT_NAME, payload);
  }
}

export class DispatchCreatedEvent extends DomainEvent<{
  dispatchOrderId: string;
  affectedDistrict: string;
  resourceCount: number;
  agencies: string[];
}> {
  static readonly EVENT_NAME = "DISPATCH_CREATED";
  constructor(payload: {
    dispatchOrderId: string;
    affectedDistrict: string;
    resourceCount: number;
    agencies: string[];
  }) {
    super(DispatchCreatedEvent.EVENT_NAME, payload);
  }
}

export class DispatchConfirmedEvent extends DomainEvent<{
  dispatchOrderId: string;
  confirmedByAgency: string;
  confirmedAt: Date;
}> {
  static readonly EVENT_NAME = "DISPATCH_CONFIRMED";
  constructor(payload: {
    dispatchOrderId: string;
    confirmedByAgency: string;
    confirmedAt: Date;
  }) {
    super(DispatchConfirmedEvent.EVENT_NAME, payload);
  }
}

export class DispatchRejectedEvent extends DomainEvent<{
  dispatchOrderId: string;
  rejectedByAgency: string;
  rejectionReason?: string;
  rejectedAt: Date;
}> {
  static readonly EVENT_NAME = "DISPATCH_REJECTED";
  constructor(payload: {
    dispatchOrderId: string;
    rejectedByAgency: string;
    rejectionReason?: string;
    rejectedAt: Date;
  }) {
    super(DispatchRejectedEvent.EVENT_NAME, payload);
  }
}

export class ResourceDispatchedEvent extends DomainEvent<{
  dispatchOrderId: string;
  dispatchedAt: Date;
  responsibleTeam: string;
}> {
  static readonly EVENT_NAME = "RESOURCE_DISPATCHED";
  constructor(payload: {
    dispatchOrderId: string;
    dispatchedAt: Date;
    responsibleTeam: string;
  }) {
    super(ResourceDispatchedEvent.EVENT_NAME, payload);
  }
}

export class ResourceLocationUpdatedEvent extends DomainEvent<{
  dispatchOrderId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp: Date;
}> {
  static readonly EVENT_NAME = "RESOURCE_LOCATION_UPDATED";
  constructor(payload: {
    dispatchOrderId: string;
    latitude: number;
    longitude: number;
    locationName: string;
    timestamp: Date;
  }) {
    super(ResourceLocationUpdatedEvent.EVENT_NAME, payload);
  }
}

export class ResourceDeliveredEvent extends DomainEvent<{
  dispatchOrderId: string;
  deliveredAt: Date;
  receivedBy?: string;
}> {
  static readonly EVENT_NAME = "RESOURCE_DELIVERED";
  constructor(payload: {
    dispatchOrderId: string;
    deliveredAt: Date;
    receivedBy?: string;
  }) {
    super(ResourceDeliveredEvent.EVENT_NAME, payload);
  }
}
