import { ACCESS_TOKEN_SECRET } from './config';
import bcrypt from 'bcrypt';
import express from "express";
import http from "http";
const { Server } = require("socket.io");
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import EventManager from "./EventManager";
import Subscriber from "./model/Subscriber";
import Publisher from "./model/Publisher";
import User from "./model/User";
import { logger, httpLogger } from "./Logger";
import UserTopic from "./model/UserTopic";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(httpLogger);
app.use(express.static('src/public/static'));
const server = http.createServer(app);
const io = new Server(server);

const logSocket = (id: string, message: any) => logger.info(`[${id}] ${message}`);

const users = new Map<string, User>();
const pubsub = new EventManager();
const userTopics = new Map<User, Array<UserTopic>>();
////////////////////////////////////////////////////////////////////////////////////////////////
// auth routes
////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/users", (req, res) => {
  res.json(Array.from( users.values() ));
});

app.post("/user/register", async (req, res) => {
  const username = req.body.username;
  const userType = req.body.userType;
  const password = req.body.password;
  if (!username || !userType || !password) {
    res.status(400).send();
    return;
  }
  if (users.has(username)) {
    logger.error(`[REGISTER] user ${username} already registered as ${users.get(username)?.constructor.name}`);
    res.status(403).send(`User ${username} already registered as ${users.get(username)?.constructor.name}`);
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (userType === "publisher") {
      users.set(username, new Publisher(username, hashedPassword, pubsub));
    } else if (userType === "subscriber") {
      users.set(username, new Subscriber(username, hashedPassword, pubsub, () => {}));
    }
    logger.info(`[REGISTER] user ${username} as ${userType}`);
    logger.info(users);
    res.status(201).send();
  } catch {
    res.status(500).send();
  }
});

app.post("/user/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    res.status(400).send();
    return;
  }
  const user = users.get(username);
  if (user == null) {
    logger.error(`[LOGIN] user ${username} is not registered`);
    return res.status(400).send("Invalid username or password");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const userType = users.get(username)?.constructor.name;
      logger.info(`[LOGIN] user ${username} as ${userType}`);
      const accessToken = jwt.sign(Object.assign({}, user), ACCESS_TOKEN_SECRET);
      res.cookie('accessToken', accessToken);
      res.json({ userType: userType});
    } else {
      logger.error(`[LOGIN] user ${username} bad password`);
      res.status(400).send("Invalid username or password");
    }
  } catch {
    res.status(500).send();
  }
});

app.delete("/user/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.sendStatus(204);
});

function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  if (token == null) {
    logger.error("token null");
    return res.redirect("/");
  }
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      logger.error("token not valid");
      return res.redirect("/");
    }
    next();
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////
// other routes
////////////////////////////////////////////////////////////////////////////////////////////////

app.all("/", (req, res) => {
  const token = req.cookies.accessToken;
  const payload = jwt.decode(token);
  if (payload == null) {
    return res.sendFile(__dirname + "/public/");
  }
  if (users.has(payload["username"])) {
    if (payload["role"] === "publisher") {
      return res.redirect("/publisher");
    } else if (payload["role"] === "subscriber") {
      return res.redirect("/subscriber");
    }
  } else {
    res.clearCookie("accessToken");
  }
  res.sendFile(__dirname + "/public/");
});

app.all("/subscriber", authenticateToken, (req, res) => {
  const token = req.cookies.accessToken;
  const payload = jwt.decode(token);
  if (payload && users.has(payload["username"])) {
    res.sendFile(__dirname + "/public/subscriber.html");
  } else {
    res.redirect("/");
  }
});

app.all("/publisher", authenticateToken, (req, res) => {
  const token = req.cookies.accessToken;
  const payload = jwt.decode(token);
  if (payload && users.has(payload["username"])) {
    res.sendFile(__dirname + "/public/publisher.html");
  } else {
    res.redirect("/");
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////
// socker.io
////////////////////////////////////////////////////////////////////////////////////////////////

io.on("connection", (socket) => {
  const accessToken = socket.handshake.query.accessToken;
  logger.info(`accessToken from socket handshake: ${accessToken}`);
  const log = (message: any) => logSocket(socket.id, message);
  log("received connection, waiting for identification...");

  const payload = jwt.decode(accessToken);
  const username = payload["username"];

  socket.on("subscriber", (_, ack) => {
    log(`${username} registered as a subscriber!`);
    const subscriber = users.get(username) as Subscriber;
    if (subscriber) {
      subscriber.onMessage = (topic, content) => {
        socket.emit("update", { topic, content });
      };
      // send back to subscriber the list of topics to which he
      // subscribes with their contents
      if (userTopics.has(subscriber) === false) {
        userTopics.set(subscriber, []);
      }
      const rateTopics = userTopics.get(subscriber);
      const topics: { topic: string; publishers: string[] }[] = subscriber.getSubscriberTopics();
      const articles = topics.flatMap((topic) =>
        pubsub.getContentList(topic.topic).map((content) => ({ topic: topic.topic, content }))
      );
      const orderedArticles = subscriber.sortArticles(articles, rateTopics);
      const allTopics = pubsub.getAllTopicList();
      ack({ username: username, topics: topics, articles: orderedArticles, allTopics: allTopics, rateTopics: rateTopics});

      socket.on("subscribe", (topic, ack) => {
        log(`subscribed to ${topic}`);
        subscriber.subscribe(topic);
        const topicObject: { topic: string; publishers: string[] } = subscriber
          .getSubscriberTopics()
          .find((t) => t.topic === topic)!!;
        // Send back all messages for topic
        let e = subscriber.sortArticles(pubsub.getContentList(topic).map((content) => ({ topic, content })), rateTopics);
        ack({ topic: topicObject, articles: e });
      });

      socket.on("getRating", (ack) => {
        ack({rateTopics: userTopics.get(subscriber)});
      });

      socket.on("updateRating", (topic, rate) => {
        let index = rateTopics.findIndex(element => element.topic === topic);
        if (index != -1) {
          rateTopics.splice(index, 1);
          rateTopics.push(new UserTopic(topic, rate))
        }
        else {
          rateTopics.push(new UserTopic(topic, rate))
        }
        userTopics.set(subscriber, rateTopics);
      })

      socket.on("unsubscribe", (topic) => {
        log(`unsubscribed from ${topic}`);
        subscriber.unsubscribe(topic);
      });
    } 
    // else { // user not found
    //   ack({ userNotFound: true });
    // }
  });

  socket.on("publisher", (_, ack) => {
    log(`user "${username}" connected as a publisher!`);
    const publisher = users.get(username)! as Publisher;
    if (publisher) {
      const topics = publisher.getPublisherTopics();
      const allTopics = pubsub.getAllTopicList();
      ack({ username: username, topics: topics, allTopics: allTopics });

      socket.on("register", (topic) => {
        publisher.register(topic);
        // send notification with the new topic to all connected users
        io.emit("topicRegistered", topic, publisher.username);
      });

      socket.on("unregister", (topic) => {
        publisher.unregister(topic);
        // send notification with the unregistered topic to all connected users
        io.emit("topicUnregistered", topic, publisher.username);
      });

      socket.on("publish", (topic, text) => {
        publisher.publish(topic, text);
      });
    }
  });

  socket.on("disconnect", () => {
    log(`user "${username}" disconnected`);
  });
});

server.listen(PORT, () => {
  logger.info(`Listening on ${PORT}`);
});
