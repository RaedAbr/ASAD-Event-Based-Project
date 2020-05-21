import EventManager from "../EventManager";
import ISubscriber from "./ISubscriber";
import ITopicData from "./ITopicData";

/**
 * Subscriber logic
 *
 * @class Subscriber
 * @implements {ISubscriber}
 */
class Subscriber implements ISubscriber {
  /**
   * Creates an instance of Subscriber.
   * @param {EventManager} pubsub Manage events related to topics, subscribers and publishers
   * @param {(topic: string, content: any) => void} _onMessage Action to perform when new topic content is published
   * @memberof Subscriber
   */
  constructor(
    private pubsub: EventManager,
    private _onMessage: (topic: string, content: { text: string; publisher: string }) => void
  ) {}

  set onMessage(onMessage: (topic: string, content: { text: string; publisher: string }) => void) {
    this._onMessage = onMessage;
  }

  subscribe(topic: string) {
    this.pubsub.subscribe(topic, this);
  }

  unsubscribe(topic: string) {
    this.pubsub.unsubscribe(topic, this);
  }

  notify(topic: string, content: { text: string; publisher: string }) {
    this._onMessage(topic, content);
  }

  getSubscriberTopics(): { topic: string; publishers: string[] }[] {
    return this.pubsub.getSubscriberTopics(this);
  }
}

export default Subscriber;
