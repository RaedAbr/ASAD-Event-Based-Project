import EventManager from "../EventManager";
import { ISubscriber } from "./ISubscriber";

class Subscriber implements ISubscriber {
  constructor(private pubsub: EventManager, private _onMessage: (topic: string, data: any) => void) {
  }

  set onMessage(onMessage: (topic: string, data: string) => void) {
    this._onMessage = onMessage;
  }

  subscribe(topic: string) {
    this.pubsub.subscribe(topic, this);
  }

  unsubscribe(topic: string) {
    this.pubsub.unsubscribe(topic, this);
  }

  notify(topic: string, data: any) {
    this._onMessage(topic, data);
  }
}

export default Subscriber;
