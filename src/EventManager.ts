import Publisher from "./Publisher";
import Subscriber from "./Subscriber";

class EventManager {

  publishers: Map<string, Set<Publisher>> = new Map();
  subscribers: Map<string, Set<Subscriber>> = new Map();

  constructor(private strict: boolean = false) {
  }

  subscribe(event: string, subscriber: Subscriber) {
    this.eventExists(event);
    // @ts-ignore
    this.subscribers.get(event).add(subscriber);
  }

  unsubscribe(event: string, subscriber: Subscriber) {
    this.eventExists(event);
    // @ts-ignore
    this.subscribers.get(event).delete(subscriber);
  }

  register(event: string, publisher: Publisher) {
    if (!this.publishers.has(event)) this.publishers.set(event, new Set());
    // @ts-ignore
    this.publishers.get(event).add(publisher);
  }

  unregister(event: string, publisher: Publisher) {
    if (!this.publishers.has(event) && this.strict) throw new Error(`No publisher registered for ${event}`);
    // @ts-ignore
    this.publishers.get(event).delete(publisher);
  }

  notify(event: string, payload: any) {
    this.eventExists(event);
    // @ts-ignore
    this.subscribers.get(event).forEach((subscriber) => subscriber.notify(event, payload));
  }

  private eventExists(event: string) {
    if (!this.subscribers.has(event)) {
      if (this.strict) throw new Error(`No subscribers registered on event [${event}]`);
      else this.subscribers.set(event, new Set());
    }
  }
}

export default EventManager;
