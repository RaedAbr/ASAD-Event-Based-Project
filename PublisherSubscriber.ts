import Publisher from "./Publisher";

class PublisherSubscriber {

  /**
   * Counts the number of publishers per event
   */
  publishers: Map<string, number> = new Map();
  subscribers: Map<string, Set<Function>> = new Map();

  constructor(private strict: boolean = false) {
  }

  subscribe(event: string, callback: Function) {
    this.eventExists(event);
    // @ts-ignore
    this.subscribers.get(event).add(callback);
  }

  unsubscribe(event: string, callback: Function) {
    this.eventExists(event);
    // @ts-ignore
    this.subscribers.get(event).delete(callback);
  }

  register(event: string) {
    if (!this.publishers.has(event)) this.publishers.set(event, 0);
  }

  unregister(event: string) {
    if (!this.publishers.has(event) && this.strict) throw new Error(`No publisher registered for ${event}`);
  }

  publish(event: string, payload: any) {
    this.eventExists(event);
    // @ts-ignore
    this.subscribers.get(event).forEach((callback) => callback(payload));
  }

  private eventExists(event: string) {
    if (!this.subscribers.has(event)) {
      if (this.strict) throw new Error(`No subscribers registered on event [${event}]`);
      else this.register(event);
    }
  }
}

export default PublisherSubscriber;
