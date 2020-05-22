import Publisher from "./Publisher";
import Subscriber from "./Subscriber";

/**
 * Topic related data representation
 *
 * @interface ITopicData
 */
interface ITopicData {
  /**
   * List of unique publishers
   *
   * @type {Set<Publisher>}
   * @memberof ITopicData
   */
  publishers: Set<Publisher>;
  /**
   * List of unique subscribers
   *
   * @type {Set<Subscriber>}
   * @memberof topicData
   */
  subscribers: Set<Subscriber>;
  /**
   * Topic content list
   *
   * @type {{text: string, publisher: string}[]}
   * @memberof topicData
   */
  contentList: { text: string; publisher: string }[];
}

export default ITopicData;
