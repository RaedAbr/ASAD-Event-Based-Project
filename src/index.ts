import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import EventManager from './EventManager';
import Subscriber from "./Subscriber";
import Publisher from "./Publisher";

const app = express();
const server = http.createServer(app);
const io = socketio(http);

const logSocket = (id: string, message: string) => console.log(`[${id}] ${message}`);

const pubsub = new EventManager(false);

app.get('/subscriber', (req, res) => {
  res.sendFile('./public/subscriber.html');
});

app.get('/publisher', (req, res) => {
  res.sendFile('./public/publisher.html');
});

io.on('connection', (socket) => {

  const log = (message: string) => logSocket(socket.id, message);
  log('received connection, waiting for identification...');

  socket.on('subscriber', (ack) => {
    ack();

    log('registered as a subscriber!');
    const subscriber = new Subscriber(pubsub, (topic, data) => {
      socket.emit('update', { topic, data });
    });

    socket.on('subscribe', (topic) => {
      log(`subscribed to ${topic}`);
      subscriber.subscribe(topic);
    });

    socket.on('unsubscribe', (topic) => {
      log(`unsubscribed from ${topic}`);
      subscriber.unsubscribe(topic);
    });
  });

  socket.on('publisher', (ack) => {
    ack();

    log('registered as a publisher!');
    const publisher = new Publisher(pubsub);

    socket.on('register', (topic) => {
      publisher.register(topic);
    });

    socket.on('unregister', (topic) => {
      publisher.unregister(topic);
    });

    socket.on('publish', ({ topic, data }) => {
      publisher.publish(topic, data);
    });
  });
});

server.listen(3000, () => {
  console.log('Listening on 3000');
});
