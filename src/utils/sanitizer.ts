import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Validates and sanitizes a username
 * @param username - The username to validate
 * @returns Sanitized username or null if invalid
 */
export function validateUsername(username: string): string | null {
  if (!username || typeof username !== "string") {
    return null;
  }
  
  const sanitized = sanitizeInput(username.trim());
  
  // Username must be between 3 and 30 characters and contain only alphanumeric characters, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  
  if (!usernameRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes a topic name
 * @param topic - The topic name to validate
 * @returns Sanitized topic or null if invalid
 */
export function validateTopic(topic: string): string | null {
  if (!topic || typeof topic !== "string") {
    return null;
  }
  
  const sanitized = sanitizeInput(topic.trim());
  
  // Topic must be between 2 and 50 characters and contain only alphanumeric characters, spaces, underscores, and hyphens
  const topicRegex = /^[a-zA-Z0-9 _-]{2,50}$/;
  
  if (!topicRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes content text
 * @param text - The content text to validate
 * @returns Sanitized text or null if invalid
 */
export function validateContent(text: string): string | null {
  if (!text || typeof text !== "string") {
    return null;
  }
  
  const sanitized = sanitizeInput(text.trim());
  
  // Content must be between 1 and 1000 characters
  if (sanitized.length < 1 || sanitized.length > 1000) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns true if valid, false otherwise
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== "string") {
    return false;
  }
  
  // Password must be at least 8 characters
  if (password.length < 8) {
    return false;
  }
  
  return true;
}
