import IPublisher from "./IPublisher";
import EventManager from "../EventManager";

/**
 * Publisher logic
 *
 * @class Publisher
 * @implements {IPublisher}
 */
class Publisher implements IPublisher {
  /**
   * Creates an instance of Publisher.
   *
   * @param {string} username Publisher name
   * @param {EventManager} pubsub Manage events related to topics, subscribers and publishers
   * @memberof Publisher
   */
  constructor(public username: string, private pubsub: EventManager) {}

  register(topic: string) {
    this.pubsub.register(topic, this);
  }

  unregister(topic: string) {
    this.pubsub.unregister(topic, this);
  }

  publish(topic: string, text: string) {
    this.pubsub.notify(topic, {text: text, publisher: this.username});
  }

  getPublisherTopics() {
    return this.pubsub.getPublisherTopics(this);
  }
}

export default Publisher;
