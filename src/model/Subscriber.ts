import EventManager from "../EventManager";
import ISubscriber from "./ISubscriber";
import User from "./User";

/**
 * Subscriber logic
 *
 * @class Subscriber
 * @implements {ISubscriber}
 */
class Subscriber extends User implements ISubscriber {
  /**
   * Creates an instance of Subscriber.
   * @param {EventManager} pubsub Manage events related to topics, subscribers and publishers
   * @param {(topic: string, content: any) => void} _onMessage Action to perform when new topic content is published
   * @memberof Subscriber
   */
  constructor(
    public username: string,
    public password: string,
    private pubsub: EventManager,
    private _onMessage: (topic: string, content: { text: string; publisher: string }) => void
  ) {
    super(username, password, "subscriber");
  }

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

  sortArticles(articles, rate) {
    articles.forEach(a => {
      rate.forEach(r => {
        if (a.topic === r.topic) {
          a.content = { text: a.content.text, publisher: a.content.publisher, id: a.content.id, rate: r.rate };
        }
      })
    })

    return articles;
  }

}

export default Subscriber;
