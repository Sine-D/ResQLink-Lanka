import { eventBus } from "../../infrastructure/event-bus/EventBus";
import { WarningIssuedEvent } from "../../domain/events/DomainEvent";
import { dispatchNotification } from "../../../../lib/services/notificationService";
import Warning from "../../../../lib/models/Warning";

export function registerWarningEventHandlers(): void {
  eventBus.subscribe<WarningIssuedEvent>(
    WarningIssuedEvent.EVENT_NAME,
    async (event) => {
      console.log(
        `[EDA:WarningEventHandler] Processing WarningIssuedEvent for warning ${event.payload.warningId}`
      );
      try {
        const warningDoc = await Warning.findOne({ warningId: event.payload.warningId });
        if (warningDoc) {
          await dispatchNotification(warningDoc);
          console.log(
            `[EDA:WarningEventHandler] Successfully dispatched notifications for ${event.payload.warningId}`
          );
        }
      } catch (err) {
        console.error(
          `[EDA:WarningEventHandler] Failed dispatch for ${event.payload.warningId}:`,
          err
        );
      }
    }
  );
}
