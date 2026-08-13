import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

export const JWT_SECRET = jwtSecret;
export const PORT = Number(process.env.PORT) || 3000;
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const IS_GROQ_CONFIGURED = GROQ_API_KEY.startsWith("gsk_");
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
