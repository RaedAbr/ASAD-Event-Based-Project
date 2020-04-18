import Publisher from "./Publisher";
import Subscriber from "./Subscriber";

type eventData = {
  publishers: Set<Publisher>,
  subscribers: Set<Subscriber>,
  messages: Array<any>
};

class EventManager {

  events: Map<string, eventData> = new Map();

  constructor(private strict: boolean = false) {
  }

  getMessages(event: string) {
    return this.getEventData(event).messages;
  }

  subscribe(event: string, subscriber: Subscriber) {
    this.getEventData(event).subscribers.add(subscriber);
  }

  unsubscribe(event: string, subscriber: Subscriber) {
    this.getEventData(event).subscribers.delete(subscriber);
  }

  register(event: string, publisher: Publisher) {
    this.registerEvent(event);
    this.getEventData(event).publishers.add(publisher);
  }

  unregister(event: string, publisher: Publisher) {
    // @ts-ignore
    const eventData = this.getEventData(event);
    eventData.publishers.delete(publisher);
  }

  notify(event: string, payload: any) {
    const eventData = this.getEventData(event);
    eventData.subscribers.forEach((subscriber) => subscriber.notify(event, payload));
    eventData.messages.push(payload);
  }

  private getEventData(event: string) {
    if (!this.events.has(event)) {
      if (this.strict) throw new Error(`No event [${event}]`);
      else this.registerEvent(event);
    }
    return this.events.get(event) as eventData;
  }

  private registerEvent(event: string) {
    if (!this.events.has(event)) {
      this.events.set(event, {
        publishers: new Set(),
        subscribers: new Set(),
        messages: []
      });
    }
  }
}

export default EventManager;
