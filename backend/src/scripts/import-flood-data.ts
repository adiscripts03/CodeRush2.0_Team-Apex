import fs from "node:fs/promises";
import path from "node:path";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { runFloodDetection } from "../flood/flood.service.js";
import { logger } from "../logging/logger.js";

async function main(): Promise<void> {
  const filePath = path.resolve("data/sentinel/kerala-2018-sentinel.sample.json");
  const content = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(content);

  await connectMongo();
  try {
    for (const item of data.snapshots) {
      const result = await runFloodDetection({
        timestamp: item.timestamp,
        sourceImageId: data.sourceImageId,
        cells: item.cells,
        cloudCoverFraction: item.cloudCoverFraction
      });
      logger.info({ result }, `Processed flood detection for ${item.timestamp}`);
    }
    logger.info("Flood data import completed successfully");
  } finally {
    await disconnectMongo();
  }
}

if (process.argv[1]?.endsWith("import-flood-data.ts")) {
  main().catch((error: unknown) => {
    logger.fatal({ err: error }, "Flood data import failed");
    process.exit(1);
  });
}
