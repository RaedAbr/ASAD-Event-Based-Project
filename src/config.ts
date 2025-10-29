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
