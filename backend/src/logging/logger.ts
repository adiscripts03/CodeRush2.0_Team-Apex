import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: "kerala-floods-eoc-backend"
  },
  redact: {
    paths: ["req.headers.authorization", "MONGODB_URI"],
    remove: true
  }
});
