import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo, disconnectMongo } from "./db/mongo.js";
import { logger } from "./logging/logger.js";

async function bootstrap(): Promise<void> {
  await connectMongo();

  const server = createServer(createApp());

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Backend server listening");
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, "Shutting down backend server");
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, "Backend bootstrap failed");
  process.exit(1);
});
