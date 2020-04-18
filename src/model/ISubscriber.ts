export interface ISubscriber {
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  notify(topic: string, data: any): void;
}