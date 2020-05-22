import EventManager from "../EventManager";
import IPublisher from "./IPublisher";
import User from "./User";

/**
 * Publisher logic
 *
 * @class Publisher
 * @implements {IPublisher}
 */
class Publisher extends User implements IPublisher {
  /**
   * Creates an instance of Publisher.
   *
   * @param {string} username Publisher name
   * @param {EventManager} pubsub Manage events related to topics, subscribers and publishers
   * @memberof Publisher
   */
  constructor(
    public username: string,
    public password: string,
    private pubsub: EventManager
  ) {
    super(username, password, "publisher");
  }

  register(topic: string) {
    this.pubsub.register(topic, this);
  }

  unregister(topic: string) {
    this.pubsub.unregister(topic, this);
  }

  publish(topic: string, text: string) {
    this.pubsub.notify(topic, { text: text, publisher: this.username });
  }

  getPublisherTopics() {
    return this.pubsub.getPublisherTopics(this);
  }
}

export default Publisher;
