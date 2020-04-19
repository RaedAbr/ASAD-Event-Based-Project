import EventManager from "../EventManager";
import IPublisher from "./IPublisher";

/**
 * Publisher logic
 *
 * @class Publisher
 * @implements {IPublisher}
 */
class Publisher implements IPublisher {
  /**
   * Creates an instance of Publisher.
   * @param {EventManager} pubsub Manage events related to topics, subscribers and publishers
   * @memberof Publisher
   */
  constructor(private pubsub: EventManager) {}

  register(topic: string) {
    this.pubsub.register(topic, this);
  }

  unregister(topic: string) {
    this.pubsub.unregister(topic, this);
  }

  publish(topic: string, content: any) {
    this.pubsub.notify(topic, content);
  }

  getPublisherTopics() {
    return this.pubsub.getPublisherTopics(this);
  }
}

export default Publisher;
