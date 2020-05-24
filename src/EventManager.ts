import uniqid from 'uniqid';
import Publisher from "./model/Publisher";
import Subscriber from "./model/Subscriber";
import ITopicData from "./model/ITopicData";

/**
 * Manage events like register and unregister topics, publish new topic content,
 * subscribing to topics...
 *
 * @class EventManager
 */
class EventManager {
  /**
   * List of topics
   *
   * @private
   * @type {Map<string, ITopicData>}
   * @memberof EventManager
   */
  private topics: Map<string, ITopicData> = new Map();

  /**
   * Get all topics list
   *
   * @returns {string[]} Topics list
   * @memberof EventManager
   */
  getAllTopicList(): string[] {
    return Array.from(this.topics.keys());
  }

  /**
   * Get list of published content of given topic
   *
   * @param {string} topic Topic name
   * @returns Topic content list
   * @memberof EventManager
   */
  getContentList(topic: string): { text: string; publisher: string }[] {
    return this.getTopicData(topic).contentList;
  }

  /**
   * Get topics list of given publisher
   *
   * @param {Publisher} publisher Owner of topics
   * @returns {string[]} List of topics
   * @memberof EventManager
   */
  getPublisherTopics(publisher: Publisher): string[] {
    const topics: string[] = [];
    this.topics.forEach((topicData, topic) => {
      if (topicData.publishers.has(publisher)) {
        topics.push(topic);
      }
    });
    return topics;
  }

  /**
   * Get topics list of given subscriber
   *
   * @param {Subscriber} subscriber Subscriber to topics
   * @returns {{topic: string, publishers: string[]}[]} List of topics
   * @memberof EventManager
   */
  getSubscriberTopics(subscriber: Subscriber): { topic: string; publishers: string[] }[] {
    const topics: { topic: string; publishers: string[] }[] = [];
    this.topics.forEach((eventData, topic) => {
      if (eventData.subscribers.has(subscriber)) {
        topics.push({ topic, publishers: Array.from(eventData.publishers.values()).map((p) => p.username) });
      }
    });
    return topics;
  }

  /**
   * Subscribe new subscriber to a topic
   *
   * @param {string} topic Topic name
   * @param {Subscriber} subscriber Subscriber
   * @memberof EventManager
   */
  subscribe(topic: string, subscriber: Subscriber) {
    this.getTopicData(topic).subscribers.add(subscriber);
  }

  /**
   * Unsubscribe a subscriber from a topic
   *
   * @param {string} topic Topic name
   * @param {Subscriber} subscriber Subscriber
   * @memberof EventManager
   */
  unsubscribe(topic: string, subscriber: Subscriber) {
    this.getTopicData(topic).subscribers.delete(subscriber);
  }

  /**
   * Register new topic by a publisher
   *
   * @param {string} topic Topic name
   * @param {Publisher} publisher Publisher
   * @memberof EventManager
   */
  register(topic: string, publisher: Publisher) {
    this.registerTopic(topic);
    this.getTopicData(topic).publishers.add(publisher);
  }

  /**
   * Unregister a topic by a publisher
   *
   * @param {string} topic Topic name
   * @param {Publisher} publisher Publisher
   * @memberof EventManager
   */
  unregister(topic: string, publisher: Publisher) {
    const topicData = this.getTopicData(topic);
    topicData.publishers.delete(publisher);
  }

  /**
   * Notify subscribers with new topic content
   *
   * @param {string} topic Topic name
   * @param {{text: string, publisher: string}} content Topic content
   * @memberof EventManager
   */
  notify(topic: string, content: { text: string; publisher: string }) {
    this.getMatchingTopics(topic).forEach((topicData) => {
      topicData.subscribers.forEach((subscriber) => subscriber.notify(topic, content));
      topicData.contentList.push({ ...content, id: uniqid() });
    });
  }

  /**
   * Get topic information: publishers, subscribers and contents
   *
   * @private
   * @param {string} topic Topic name
   * @returns {ITopicData} Topic information
   * @memberof EventManager
   */
  private getTopicData(topic: string): ITopicData {
    if (!this.topics.has(topic)) {
      this.registerTopic(topic);
    }
    return this.topics.get(topic) as ITopicData;
  }

  /**
   * Returns all topics matching with given topic, which means where
   * beginning of topic name is equal to given topic
   * @param topic
   */
  private getMatchingTopics(topic: string): ITopicData[] {
    const matching: ITopicData[] = [];
    this.topics.forEach((data, name) => {
      if (name.startsWith(topic)) matching.push(data);
    });
    return matching;
  }

  /**
   * Register new topic
   *
   * @private
   * @param {string} topic Topic name
   * @memberof EventManager
   */
  private registerTopic(topic: string) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, {
        publishers: new Set(),
        subscribers: new Set(),
        contentList: [],
      });
    }
  }
}

export default EventManager;
