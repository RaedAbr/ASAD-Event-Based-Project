import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config";
import loggerModule from "../Logger.js";

const { logger } = loggerModule;

/**
 * Middleware to authenticate JWT tokens from cookies
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.accessToken;
  
  if (token == null) {
    logger.error("Authentication failed: No token provided");
    return res.redirect("/");
  }
  
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      logger.error("Authentication failed: Invalid token");
      return res.redirect("/");
    }
    
    req.user = user;
    next();
  });
}

/**
 * Creates a sanitized JWT payload without sensitive information
 */
export function createTokenPayload(username: string, role: "publisher" | "subscriber") {
  return {
    username,
    role,
    iat: Math.floor(Date.now() / 1000),
  };
}

/**
 * Verifies and decodes a JWT token
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    logger.error(`Token verification failed: ${err.message}`);
    return null;
  }
}
