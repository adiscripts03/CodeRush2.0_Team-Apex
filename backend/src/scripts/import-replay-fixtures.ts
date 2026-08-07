import path from "node:path";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { logger } from "../logging/logger.js";
import { importReplayFile } from "./import-replay.js";

async function main(): Promise<void> {
  await connectMongo();
  try {
    const result = await importReplayFile(path.resolve("data/replay/kerala-floods-2018.sample.json"));
    logger.info(result, "Replay fixture imported");
  } finally {
    await disconnectMongo();
  }
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, "Replay fixture import failed");
  process.exit(1);
});
