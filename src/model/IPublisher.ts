/**
 * Interface representing a publisher
 *
 * @interface IPublisher
 */
interface IPublisher {
  /**
   * Register new topic
   *
   * @param {string} topic Topic name
   * @memberof IPublisher
   */
  register(topic: string): void;

  /**
   * Delete topic
   *
   * @param {string} topic Topic name
   * @memberof IPublisher
   */
  unregister(topic: string): void;

  /**
   * Publish new content in given topic
   *
   * @param {string} topic Topic name
   * @param {*} content Content to publish
   * @memberof IPublisher
   */
  publish(topic: string, content: any): void;

  /**
   * Get list of topic of this publisher
   *
   * @memberof IPublisher
   */
  getPublisherTopics(): void;
}

export default IPublisher;
