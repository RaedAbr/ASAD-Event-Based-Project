import { IPublisher } from "./model/IPublisher";
import express from "express";
import http from "http";
import socketio from "socket.io";
import EventManager from "./EventManager";
import Subscriber from "./model/Subscriber";
import Publisher from "./model/Publisher";
import { ISubscriber } from "./model/ISubscriber";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const logSocket = (id: string, message: any) => console.log(`[${id}] ${message}`);

const users = new Map<string, IPublisher | ISubscriber>();
const pubsub = new EventManager(false);

app.get("/", (_req, res) => {
  res.sendFile(__dirname + "/public/");
});

app.post("/login/:username", (req, res) => {
  const username = req.params.username;
  if (users.has(username)) {
    const userType = users.get(username)?.constructor.name;
    console.log(`[LOGIN] user ${username} as ${userType}`);
    res.send(userType?.toLowerCase());
    return;
  }
  console.error(`[LOGIN] user ${username} is not registered`);
  res.status(403).send(`user ${username} is not registered`);
});

app.post("/register/:userType/:username", (req, res) => {
  const userType = req.params.userType;
  const username = req.params.username;
  if (users.has(username)) {
    console.error(`[REGISTER] user ${username} already registered as ${users.get(username)?.constructor.name}`);
    res.status(403).send(`User ${username} already registered as ${users.get(username)?.constructor.name}`);
    return;
  }
  if (userType === "publisher") {
    users.set(username, new Publisher(pubsub));
  } else if (userType === "subscriber") {
    users.set(username, new Subscriber(pubsub, (_topic, _data) => {}));
  }
  console.log(`[REGISTER] user ${username} as ${userType}`);
  res.end();
});

app.get("/subscriber", (req, res) => {
  const username = req.query.username;
  if (username) {
    res.sendFile(__dirname + "/public/subscriber.html");
  } else {
    res.redirect("/");
  }
});

app.get("/publisher", (req, res) => {
  const username = req.query.username;
  if (username) {
    res.sendFile(__dirname + "/public/publisher.html");
  } else {
    res.redirect("/");
  }
});

io.on("connection", (socket) => {
  const log = (message: any) => logSocket(socket.id, message);
  log("received connection, waiting for identification...");

  socket.on("subscriber", (ack) => {
    ack();

    log("registered as a subscriber!");
    const subscriber = new Subscriber(pubsub, (topic, data) => {
      socket.emit("update", { topic, data });
    });

    socket.on('subscribe', (topic, ack) => {
      log(`subscribed to ${topic}`);
      subscriber.subscribe(topic);
      ack(pubsub.getMessages(topic).map(data => ({ topic, data }))); // Send back all messages for topic
    });

    socket.on("unsubscribe", (topic) => {
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

  socket.on("disconnect", () => {
    log("Disconnected");
  });
});

server.listen(3000, () => {
  console.log("Listening on 3000");
});
