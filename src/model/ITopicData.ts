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
   * @type {Array<any>}
   * @memberof topicData
   */
  contentList: Array<any>;
};

export default ITopicData;