export interface IPublisher {
  register(topic: string): void;
  unregister(topic: string): void;
  publish(topic: string, data: any): void;
}