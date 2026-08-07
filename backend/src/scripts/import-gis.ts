import fs from "node:fs/promises";
import path from "node:path";
import { MongoAuditService } from "../audit/audit.service.js";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { importGisCollection } from "../gis/gis.service.js";
import { createChecksum, isGisLayerType, parseFeatureCollection } from "../gis/geojson.js";
import { logger } from "../logging/logger.js";

interface ImportArgs {
  file: string;
  layer: string;
  sourceName: string;
  provider: string;
  license: string;
  sourceUrl?: string;
}

function readArg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function parseArgs(): ImportArgs {
  const file = readArg("file");
  const layer = readArg("layer");
  const sourceName = readArg("source-name");
  const provider = readArg("provider");
  const license = readArg("license");

  if (!file || !layer || !sourceName || !provider || !license) {
    throw new Error("Required args: --file --layer --source-name --provider --license");
  }

  return {
    file,
    layer,
    sourceName,
    provider,
    license,
    sourceUrl: readArg("source-url")
  };
}

export async function importGisFile(args: ImportArgs): Promise<number> {
  if (!isGisLayerType(args.layer)) {
    throw new Error(`Unsupported GIS layer: ${args.layer}`);
  }

  const resolvedPath = path.resolve(args.file);
  const content = await fs.readFile(resolvedPath, "utf8");
  const checksum = createChecksum(content);
  const collection = parseFeatureCollection(content);

  const importedCount = await importGisCollection({
    layer: args.layer,
    collection,
    source: {
      name: args.sourceName,
      provider: args.provider,
      license: args.license,
      sourceUrl: args.sourceUrl,
      checksum,
      importedAt: new Date()
    }
  });

  await new MongoAuditService().record({
    eventType: "gis.import.completed",
    actorType: "system",
    correlationId: `gis-import:${args.layer}:${checksum}`,
    hazardType: "flood",
    payload: {
      layer: args.layer,
      file: resolvedPath,
      importedCount,
      checksum,
      sourceName: args.sourceName,
      provider: args.provider,
      license: args.license,
      sourceUrl: args.sourceUrl
    }
  });

  return importedCount;
}

async function main(): Promise<void> {
  await connectMongo();
  try {
    const importedCount = await importGisFile(parseArgs());
    logger.info({ importedCount }, "GIS import completed");
  } finally {
    await disconnectMongo();
  }
}

if (process.argv[1]?.endsWith("import-gis.ts")) {
  main().catch((error: unknown) => {
    logger.fatal({ err: error }, "GIS import failed");
    process.exit(1);
  });
}
