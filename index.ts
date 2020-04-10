import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import PublisherSubscriber from './PublisherSubscriber';

const app = express();
const server = http.createServer(app);
const io = socketio(http);

const pubsub = new PublisherSubscriber(false);

app.get('/subscriber', (req, res) => {
  res.status(200).end("subscriber");
});

app.get('/publisher', (req, res) => {
  res.status(200).end("publisher");
});

io.on('connection', (socket) => {
  socket.on('subscribe', (event) => {
    const subscriberCallback = (event: string, data: any) => socket.emit('event', { event, data });

    pubsub.subscribe(event, subscriberCallback);

    socket.on('unsubscribe', (event) => {
      pubsub.unsubscribe(event, subscriberCallback)
    });
  });

  socket.on('register', (event) => {
    pubsub.register(event);
    socket.on('publish', ({ event, data }) => {
      pubsub.publish(event, data); // When a publisher has some data to publish broadcast it to everyone
    });
  });
});

server.listen(3000, () => {
  console.log('Listening on 3000');
});
