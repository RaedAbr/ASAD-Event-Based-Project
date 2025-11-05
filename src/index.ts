import "dotenv/config";
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  PORT,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX,
} from "./config";
import bcrypt from "bcrypt";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import EventManager from "./EventManager";
import Subscriber from "./model/Subscriber";
import Publisher from "./model/Publisher";
import User from "./model/User";
import loggerModule from "./Logger.js";
import UserTopic from "./model/UserTopic";
import fs from "fs";
import { authenticateToken, createTokenPayload, verifyToken } from "./middleware/auth";
import {
  validateUsername,
  validatePassword,
  validateTopic,
  validateContent,
} from "./utils/sanitizer";

const { logger, httpLogger } = loggerModule;

// Get app version from package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const APP_VERSION = packageJson.version;

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.socket.io"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: "10kb" })); // Limit body size
app.use(bodyParser.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(httpLogger);
app.use(express.static("src/public/static"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || false,
    credentials: true,
  },
});

const logSocket = (id: string, message: any) => logger.info(`[${id}] ${message}`);

const users = new Map<string, User>();
const pubsub = new EventManager();
const userTopics = new Map<User, Array<UserTopic>>();
////////////////////////////////////////////////////////////////////////////////////////////////
// health & version routes
////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/health", (req, res) => {
  // Limited health information to prevent information disclosure
  res.json({
    status: "ok",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
});

app.get("/version", (req, res) => {
  res.json({ version: APP_VERSION, name: packageJson.name });
});

////////////////////////////////////////////////////////////////////////////////////////////////
// auth routes
////////////////////////////////////////////////////////////////////////////////////////////////

// Remove the /users endpoint - it exposes sensitive information
// If needed for admin purposes, it should be protected and return sanitized data

app.post("/user/register", async (req, res) => {
  const username = req.body.username;
  const userType = req.body.userType;
  const password = req.body.password;
  
  // Validate input
  if (!username || !userType || !password) {
    return res.status(400).send("Missing required fields");
  }
  
  // Validate username
  const validatedUsername = validateUsername(username);
  if (!validatedUsername) {
    return res.status(400).send("Invalid username. Must be 3-30 characters and contain only letters, numbers, underscores, and hyphens.");
  }
  
  // Validate password
  if (!validatePassword(password)) {
    return res.status(400).send("Invalid password. Must be at least 8 characters.");
  }
  
  // Validate user type
  if (userType !== "publisher" && userType !== "subscriber") {
    return res.status(400).send("Invalid user type");
  }
  
  if (users.has(validatedUsername)) {
    logger.error(`[REGISTER] user ${validatedUsername} already exists`);
    return res.status(409).send("Username already exists");
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    if (userType === "publisher") {
      users.set(validatedUsername, new Publisher(validatedUsername, hashedPassword, pubsub));
    } else {
      users.set(validatedUsername, new Subscriber(validatedUsername, hashedPassword, pubsub, () => {}));
    }
    logger.info(`[REGISTER] user ${validatedUsername} as ${userType}`);
    res.status(201).send();
  } catch (error) {
    logger.error(`[REGISTER] Error: ${error}`);
    res.status(500).send("Internal server error");
  }
});

app.post("/user/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  if (!username || !password) {
    return res.status(400).send("Missing username or password");
  }
  
  // Validate username format
  const validatedUsername = validateUsername(username);
  if (!validatedUsername) {
    return res.status(400).send("Invalid username or password");
  }
  
  const user = users.get(validatedUsername);
  if (user == null) {
    logger.error(`[LOGIN] user ${validatedUsername} not found`);
    return res.status(400).send("Invalid username or password");
  }
  
  try {
    if (await bcrypt.compare(password, user.password)) {
      const userType = user.constructor.name;
      logger.info(`[LOGIN] user ${validatedUsername} as ${userType}`);
      
      // Create sanitized token payload without sensitive data
      const tokenPayload = createTokenPayload(validatedUsername, user.role);
      const accessToken = jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      });
      
      // Set secure cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000, // 1 hour
      });
      
      res.json({ userType: userType });
    } else {
      logger.error(`[LOGIN] user ${validatedUsername} - invalid password`);
      res.status(400).send("Invalid username or password");
    }
  } catch (error) {
    logger.error(`[LOGIN] Error: ${error}`);
    res.status(500).send("Internal server error");
  }
});

app.delete("/user/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.sendStatus(204);
});

// authenticateToken is now imported from middleware/auth.ts

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
  const accessToken = socket.handshake.query.accessToken as string;
  const log = (message: any) => logSocket(socket.id, message);
  log("received connection, waiting for identification...");

  // Verify token instead of just decoding it
  const payload = verifyToken(accessToken);
  
  if (!payload || !payload.username) {
    logger.error("Invalid token in socket connection");
    socket.disconnect(true);
    return;
  }
  
  const username = payload.username;
  const userRole = payload.role;

  socket.on("subscriber", (_, ack) => {
    // Verify user role
    if (userRole !== "subscriber") {
      logger.error(`User ${username} attempted to connect as subscriber but is ${userRole}`);
      socket.disconnect(true);
      return;
    }
    
    log(`${username} registered as a subscriber!`);
    const subscriber = users.get(username) as Subscriber;
    if (subscriber && subscriber.role === "subscriber") {
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
      ack({
        username: username,
        topics: topics,
        articles: orderedArticles,
        allTopics: allTopics,
        rateTopics: rateTopics,
      });

      socket.on("subscribe", (topic, ack) => {
        // Validate and sanitize topic
        const validatedTopic = validateTopic(topic);
        if (!validatedTopic) {
          logger.error(`Invalid topic name: ${topic}`);
          return;
        }
        
        log(`subscribed to ${validatedTopic}`);
        subscriber.subscribe(validatedTopic);
        const topicObject: { topic: string; publishers: string[] } = subscriber
          .getSubscriberTopics()
          .find((t) => t.topic === validatedTopic)!;
        // Send back all messages for topic
        const e = subscriber.sortArticles(
          pubsub.getContentList(validatedTopic).map((content) => ({ topic: validatedTopic, content })),
          rateTopics
        );
        ack({ topic: topicObject, articles: e });
      });

      socket.on("getRating", (ack) => {
        ack({ rateTopics: userTopics.get(subscriber) });
      });

      socket.on("updateRating", (topic, rate) => {
        // Validate topic
        const validatedTopic = validateTopic(topic);
        if (!validatedTopic) {
          logger.error(`Invalid topic name: ${topic}`);
          return;
        }
        
        // Validate rating (should be between 0 and 5)
        if (typeof rate !== "number" || rate < 0 || rate > 5) {
          logger.error(`Invalid rating: ${rate}`);
          return;
        }
        
        const index = rateTopics.findIndex((element) => element.topic === validatedTopic);
        if (index != -1) {
          rateTopics.splice(index, 1);
          rateTopics.push(new UserTopic(validatedTopic, rate));
        } else {
          rateTopics.push(new UserTopic(validatedTopic, rate));
        }
        userTopics.set(subscriber, rateTopics);
      });

      socket.on("unsubscribe", (topic) => {
        // Validate topic
        const validatedTopic = validateTopic(topic);
        if (!validatedTopic) {
          logger.error(`Invalid topic name: ${topic}`);
          return;
        }
        
        log(`unsubscribed from ${validatedTopic}`);
        subscriber.unsubscribe(validatedTopic);
      });
    }
    // else { // user not found
    //   ack({ userNotFound: true });
    // }
  });

  socket.on("publisher", (_, ack) => {
    // Verify user role
    if (userRole !== "publisher") {
      logger.error(`User ${username} attempted to connect as publisher but is ${userRole}`);
      socket.disconnect(true);
      return;
    }
    
    log(`user "${username}" connected as a publisher!`);
    const publisher = users.get(username)! as Publisher;
    if (publisher && publisher.role === "publisher") {
      const topics = publisher.getPublisherTopics();
      const allTopics = pubsub.getAllTopicList();
      // Get articles for all topics the publisher is publishing to
      const articles = topics.flatMap((topic) =>
        pubsub.getContentList(topic).map((content) => ({ topic, content }))
      );
      logger.info(
        `[PUBLISHER] topics: ${JSON.stringify(topics)}, articles count: ${articles.length}`
      );
      ack({ username: username, topics: topics, allTopics: allTopics, articles: articles });

      socket.on("register", (topic) => {
        // Validate and sanitize topic
        const validatedTopic = validateTopic(topic);
        if (!validatedTopic) {
          logger.error(`Invalid topic name: ${topic}`);
          return;
        }
        
        publisher.register(validatedTopic);
        // send notification with the new topic to all connected users
        io.emit("topicRegistered", validatedTopic, publisher.username);
      });

      socket.on("unregister", (topic) => {
        // Validate and sanitize topic
        const validatedTopic = validateTopic(topic);
        if (!validatedTopic) {
          logger.error(`Invalid topic name: ${topic}`);
          return;
        }
        
        publisher.unregister(validatedTopic);
        // send notification with the unregistered topic to all connected users
        io.emit("topicUnregistered", validatedTopic, publisher.username);
      });

      socket.on("publish", (topic, text) => {
        // Validate and sanitize inputs
        const validatedTopic = validateTopic(topic);
        const validatedText = validateContent(text);
        
        if (!validatedTopic || !validatedText) {
          logger.error(`Invalid publish data - topic: ${topic}, text length: ${text?.length}`);
          return;
        }
        
        logger.info(`[PUBLISH] user "${username}" publishing to topic "${validatedTopic}"`);
        publisher.publish(validatedTopic, validatedText);

        // Get the newly published content to send to all clients
        const contentList = pubsub.getContentList(validatedTopic);
        if (contentList.length > 0) {
          const latestContent = contentList[contentList.length - 1];
          // Broadcast to all connected clients (publishers and subscribers)
          io.emit("update", { topic: validatedTopic, content: latestContent });
        }
      });
    }
  });

  socket.on("disconnect", () => {
    log(`user "${username}" disconnected`);
  });
});

server.listen(PORT, () => {
  logger.info(`ASAD Event-Based App v${APP_VERSION}`);
  logger.info(`Listening on ${PORT}`);
});
