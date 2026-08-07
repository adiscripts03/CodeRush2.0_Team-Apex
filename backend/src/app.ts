import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { floodRouter } from "./api/flood.routes.js";
import { gisRouter } from "./api/gis.routes.js";
import { healthRouter } from "./api/health.routes.js";
import { hazardRouter } from "./api/hazard.routes.js";
import { impactRouter } from "./api/impact.routes.js";
import { replayRouter } from "./api/replay.routes.js";
import { resourceRouter } from "./api/resource.routes.js";
import { routeRouter } from "./api/route.routes.js";
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
  app.use("/api/gis", gisRouter);
  app.use("/api/hazards", hazardRouter);
  app.use("/api/replay", replayRouter);
  app.use("/api/flood", floodRouter);
  app.use("/flood", floodRouter);
  app.use("/api/impact", impactRouter);
  app.use("/impact", impactRouter);
  app.use("/api/resources", resourceRouter);
  app.use("/resources", resourceRouter);
  app.use("/api/routes", routeRouter);
  app.use("/routes", routeRouter);

  app.use(errorHandler);

  return app;
}
