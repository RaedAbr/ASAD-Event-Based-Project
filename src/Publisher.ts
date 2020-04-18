import EventManager from "./EventManager";

class Publisher {
  constructor(private pubsub: EventManager) {
  }

  register(topic: string) {
    this.pubsub.register(topic, this);
  }

  unregister(topic: string) {
    this.pubsub.unregister(topic, this);
  }

  publish(topic: string, data: any) {
    this.pubsub.notify(topic, data);
  }
}

export default Publisher;
