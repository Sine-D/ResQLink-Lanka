import { EventEmitter } from "events";
import { IDomainEvent } from "../../domain/events/DomainEvent";

type EventHandler<T extends IDomainEvent = any> = (event: T) => Promise<void> | void;

export class TypedEventBus {
  private static instance: TypedEventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  public static getInstance(): TypedEventBus {
    if (!TypedEventBus.instance) {
      TypedEventBus.instance = new TypedEventBus();
    }
    return TypedEventBus.instance;
  }

  public publish<T extends IDomainEvent>(event: T): void {
    // Asynchronously dispatch to event handlers without blocking caller execution
    setImmediate(async () => {
      try {
        this.emitter.emit(event.eventName, event);
      } catch (err) {
        console.error(`[EventBus] Error dispatching event ${event.eventName}:`, err);
      }
    });
  }

  public subscribe<T extends IDomainEvent>(eventName: string, handler: EventHandler<T>): void {
    this.emitter.on(eventName, async (event: T) => {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[EventBus] Error in event handler for ${eventName}:`, err);
      }
    });
  }

  public unsubscribe<T extends IDomainEvent>(eventName: string, handler: EventHandler<T>): void {
    this.emitter.off(eventName, handler);
  }

  public removeAllListeners(eventName?: string): void {
    this.emitter.removeAllListeners(eventName);
  }
}

export const eventBus = TypedEventBus.getInstance();
