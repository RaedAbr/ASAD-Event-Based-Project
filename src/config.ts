/**
 * Configuration management for environment variables
 * All environment variables should be validated and exported from this module
 */

/**
 * Validates that required environment variables are set
 * Throws an error if any are missing
 */
function validateEnv(): void {
  const required = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// Validate on module load
validateEnv();

// Export environment variables with proper typing
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
export const PORT = parseInt(process.env.PORT || "3000", 10);
export const NODE_ENV = process.env.NODE_ENV || "development";

// JWT token expiration (1 hour for access token)
export const ACCESS_TOKEN_EXPIRY = "1h";

// Security configurations
export const BCRYPT_ROUNDS = 10;
export const MAX_LOGIN_ATTEMPTS = 5;
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = 100; // max requests per window
