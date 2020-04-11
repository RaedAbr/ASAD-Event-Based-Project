import EventManager from "./EventManager";

class Subscriber {
  constructor(private pubsub: EventManager, private onMessage: (topic: string, data: any) => void) {
  }

  subscribe(topic: string) {
    this.pubsub.subscribe(topic, this);
  }

  unsubscribe(topic: string) {
    this.pubsub.unsubscribe(topic, this);
  }

  notify(topic: string, data: any) {
    this.onMessage(topic, data);
  }
}

export default Subscriber;
