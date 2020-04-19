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
   * @param {*} content Topic content
   * @memberof ISubscriber
   */
  notify(topic: string, content: any): void;

  /**
   * Get list of topics this subscriber is interested to
   *
   * @memberof ISubscriber
   */
  getSubscriberTopics(): void;
}

export default ISubscriber;
