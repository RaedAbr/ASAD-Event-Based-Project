import express from "express";
import http from "http";
import socketio from "socket.io";
import EventManager from "./EventManager";
import Subscriber from "./model/Subscriber";
import Publisher from "./model/Publisher";
import IPublisher from "./model/IPublisher";
import ISubscriber from "./model/ISubscriber";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const logSocket = (id: string, message: any) => console.log(`[${id}] ${message}`);

const users = new Map<string, IPublisher | ISubscriber>();
const pubsub = new EventManager();

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
    users.set(username, new Subscriber(pubsub, () => {}));
  }
  console.log(`[REGISTER] user ${username} as ${userType}`);
  res.end();
});

app.get("/subscriber", (req, res) => {
  const username = req.query.username;
  if (username && users.has(username as string)) {
    res.sendFile(__dirname + "/public/subscriber.html");
  } else {
    res.redirect("/");
  }
});

app.get("/publisher", (req, res) => {
  const username = req.query.username;
  if (username && users.has(username as string)) {
    res.sendFile(__dirname + "/public/publisher.html");
  } else {
    res.redirect("/");
  }
});

io.on("connection", (socket) => {
  const username = socket.handshake.query.username;
  console.log(`username from socker handshake: ${username}`);
  const log = (message: any) => logSocket(socket.id, message);
  log("received connection, waiting for identification...");

  socket.on("subscriber", (_, ack) => {
    log("registered as a subscriber!");
    const subscriber = users.get(username)! as Subscriber;
    if (subscriber) {
      subscriber.onMessage = (topic, content) => {
        socket.emit("update", { topic, content });
      };
      // send back to subscriber the list of topics to which he
      // subscribes with their contents
      const topics = subscriber.getSubscriberTopics();
      const articles = topics.flatMap((topic) => pubsub.getContentList(topic).map((content) => ({ topic, content })));
      ack({ topics: topics, articles: articles });

      socket.on("subscribe", (topic, ack) => {
        log(`subscribed to ${topic}`);
        subscriber.subscribe(topic);
        ack(pubsub.getContentList(topic).map((content) => ({ topic, content }))); // Send back all messages for topic
      });

      socket.on("unsubscribe", (topic) => {
        log(`unsubscribed from ${topic}`);
        subscriber.unsubscribe(topic);
      });
    }
  });

  socket.on("publisher", (_, ack) => {
    log(`user "${username}" connected as a publisher!`);
    const publisher = users.get(username)! as Publisher;
    if (publisher) {
      ack(publisher.getPublisherTopics());

      socket.on("register", (topic) => {
        publisher.register(topic);
      });

      socket.on("unregister", (topic) => {
        publisher.unregister(topic);
      });

      socket.on("publish", ({ topic, content }) => {
        publisher.publish(topic, content);
      });
    }
  });

  socket.on("disconnect", () => {
    log(`user "${username}" disconnected`);
  });
});

server.listen(3000, () => {
  console.log("Listening on 3000");
});
