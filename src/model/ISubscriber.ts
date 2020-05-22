/**
 * Interface representing a subscriber
 *
 * @interface ISubscriber
 */
interface ISubscriber {
  /**
   * Subscribe to a topic
   *
   * @param {string} topic Topic name
   * @memberof ISubscriber
   */
  subscribe(topic: string): void;

  /**
   * Unsubscribe from a topic
   *
   * @param {string} topic Topic name
   * @memberof ISubscriber
   */
  unsubscribe(topic: string): void;

  /**
   * Notify this subscriber with new topic content
   *
   * @param {string} topic Topic name
   * @param {{text: string, publisher: string}} content Topic content
   * @memberof ISubscriber
   */
  notify(topic: string, content: { text: string; publisher: string }): void;

  /**
   * Get list of topics this subscriber is interested to
   *
   * @returns {{topic: string, publishers: string[]}[]}
   * @memberof ISubscriber
   */
  getSubscriberTopics(): { topic: string; publishers: string[] }[];
}

export default ISubscriber;
