import { eventBus } from "../../src/core/infrastructure/event-bus/EventBus";
import {
  ResourceAllocatedEvent,
  DispatchCreatedEvent,
  DispatchConfirmedEvent,
  DispatchRejectedEvent,
  ResourceDispatchedEvent,
  ResourceLocationUpdatedEvent,
  ResourceDeliveredEvent,
} from "../../src/core/domain/events/DomainEvent";

describe("Relief Domain Event Bus Architecture", () => {
  afterEach(() => {
    eventBus.removeAllListeners();
  });

  test("publishes and consumes RESOURCE_ALLOCATED event", (done) => {
    const payload = {
      resourceId: "RES-101",
      resourceName: "Bottled Water 1L",
      quantityAllocated: 500,
      district: "Ratnapura",
      allocatedBy: "officer_123",
    };

    eventBus.subscribe<ResourceAllocatedEvent>(
      ResourceAllocatedEvent.EVENT_NAME,
      (event) => {
        expect(event.eventName).toBe("RESOURCE_ALLOCATED");
        expect(event.payload.resourceId).toBe("RES-101");
        expect(event.payload.quantityAllocated).toBe(500);
        done();
      }
    );

    eventBus.publish(new ResourceAllocatedEvent(payload));
  });

  test("publishes and consumes DISPATCH_CREATED event", (done) => {
    const payload = {
      dispatchOrderId: "DISPATCH-001",
      affectedDistrict: "Colombo",
      resourceCount: 3,
      agencies: ["Navy", "Red Cross"],
    };

    eventBus.subscribe<DispatchCreatedEvent>(
      DispatchCreatedEvent.EVENT_NAME,
      (event) => {
        expect(event.eventName).toBe("DISPATCH_CREATED");
        expect(event.payload.dispatchOrderId).toBe("DISPATCH-001");
        expect(event.payload.agencies).toContain("Navy");
        done();
      }
    );

    eventBus.publish(new DispatchCreatedEvent(payload));
  });

  test("publishes and consumes DISPATCH_CONFIRMED event", (done) => {
    const payload = {
      dispatchOrderId: "DISPATCH-002",
      confirmedByAgency: "SL Navy ResQ",
      confirmedAt: new Date(),
    };

    eventBus.subscribe<DispatchConfirmedEvent>(
      DispatchConfirmedEvent.EVENT_NAME,
      (event) => {
        expect(event.eventName).toBe("DISPATCH_CONFIRMED");
        expect(event.payload.confirmedByAgency).toBe("SL Navy ResQ");
        done();
      }
    );

    eventBus.publish(new DispatchConfirmedEvent(payload));
  });

  test("publishes and consumes DISPATCH_REJECTED event", (done) => {
    const payload = {
      dispatchOrderId: "DISPATCH-003",
      rejectedByAgency: "Air Force Relief",
      rejectionReason: "Insufficient transport helicopters available",
      rejectedAt: new Date(),
    };

    eventBus.subscribe<DispatchRejectedEvent>(
      DispatchRejectedEvent.EVENT_NAME,
      (event) => {
        expect(event.eventName).toBe("DISPATCH_REJECTED");
        expect(event.payload.rejectionReason).toContain("helicopters");
        done();
      }
    );

    eventBus.publish(new DispatchRejectedEvent(payload));
  });

  test("publishes and consumes RESOURCE_DISPATCHED event", (done) => {
    const payload = {
      dispatchOrderId: "DISPATCH-004",
      dispatchedAt: new Date(),
      responsibleTeam: "Rapid Relief Squad Alpha",
    };

    eventBus.subscribe<ResourceDispatchedEvent>(
      ResourceDispatchedEvent.EVENT_NAME,
      (event) => {
        expect(event.eventName).toBe("RESOURCE_DISPATCHED");
        expect(event.payload.responsibleTeam).toBe("Rapid Relief Squad Alpha");
        done();
      }
    );

    eventBus.publish(new ResourceDispatchedEvent(payload));
  });

  test("publishes and consumes RESOURCE_LOCATION_UPDATED event", (done) => {
    const payload = {
      dispatchOrderId: "DISPATCH-005",
      latitude: 6.9271,
      longitude: 79.8612,
      locationName: "Colombo Central Depot",
      timestamp: new Date(),
    };

    eventBus.subscribe<ResourceLocationUpdatedEvent>(
      ResourceLocationUpdatedEvent.EVENT_NAME,
      (event) => {
        expect(event.eventName).toBe("RESOURCE_LOCATION_UPDATED");
        expect(event.payload.latitude).toBe(6.9271);
        expect(event.payload.locationName).toBe("Colombo Central Depot");
        done();
      }
    );

    eventBus.publish(new ResourceLocationUpdatedEvent(payload));
  });

  test("publishes and consumes RESOURCE_DELIVERED event", (done) => {
    const payload = {
      dispatchOrderId: "DISPATCH-006",
      deliveredAt: new Date(),
      receivedBy: "District Officer Ratnapura",
    };

    eventBus.subscribe<ResourceDeliveredEvent>(
      ResourceDeliveredEvent.EVENT_NAME,
      (event) => {
        expect(event.eventName).toBe("RESOURCE_DELIVERED");
        expect(event.payload.receivedBy).toBe("District Officer Ratnapura");
        done();
      }
    );

    eventBus.publish(new ResourceDeliveredEvent(payload));
  });
});
