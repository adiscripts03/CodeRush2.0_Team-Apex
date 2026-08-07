import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { healthRouter } from "./api/health.routes.js";
import { hazardRouter } from "./api/hazard.routes.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";
import { logger } from "./logging/logger.js";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);
  app.use(pinoHttp({ logger }));

  app.use("/health", healthRouter);
  app.use("/api/hazards", hazardRouter);

  app.use(errorHandler);

  return app;
}
