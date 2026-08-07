import path from "node:path";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { logger } from "../logging/logger.js";
import { importGisFile } from "./import-gis.js";

const fixtureImports = [
  ["districts.geojson", "district_boundary", "Kerala district boundaries sample"],
  ["roads.geojson", "road", "Kerala roads sample"],
  ["rivers.geojson", "river", "Kerala rivers sample"],
  ["hospitals.geojson", "hospital", "Kerala hospitals sample"],
  ["shelters.geojson", "shelter", "Kerala shelters sample"],
  ["population.geojson", "population", "Kerala population sample"]
] as const;

async function main(): Promise<void> {
  await connectMongo();
  try {
    for (const [fileName, layer, sourceName] of fixtureImports) {
      const importedCount = await importGisFile({
        file: path.resolve("data/kerala", fileName),
        layer,
        sourceName,
        provider: "Project fixture",
        license: "For local development and tests only",
        sourceUrl: "docs/milestone-2.md"
      });
      logger.info({ layer, importedCount }, "Fixture GIS layer imported");
    }
  } finally {
    await disconnectMongo();
  }
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, "Fixture GIS import failed");
  process.exit(1);
});
