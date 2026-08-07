import fs from "node:fs/promises";
import path from "node:path";
import { MongoAuditService } from "../audit/audit.service.js";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { createChecksum } from "../gis/geojson.js";
import { logger } from "../logging/logger.js";
import { ReplaySnapshotModel } from "../models/replay-snapshot.model.js";
import { ReplayTimelineModel } from "../models/replay-timeline.model.js";

interface ReplayImportFile {
  timeline: {
    name: string;
    description?: string;
    startsAt: string;
    endsAt: string;
    timestepMinutes: number;
    source: {
      name: string;
      provider: string;
      license: string;
    };
  };
  snapshots: Array<{
    sequence: number;
    timestamp: string;
    state: Record<string, unknown>;
  }>;
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isReplayImportFile(value: unknown): value is ReplayImportFile {
  return typeof value === "object" && value !== null && "timeline" in value && "snapshots" in value;
}

export async function importReplayFile(filePath: string): Promise<{ timelineId: string; snapshotCount: number }> {
  const resolvedPath = path.resolve(filePath);
  const content = await fs.readFile(resolvedPath, "utf8");
  const checksum = createChecksum(content);
  const parsed: unknown = JSON.parse(content);

  if (!isReplayImportFile(parsed)) {
    throw new Error("Replay import file must contain timeline and snapshots");
  }

  const timeline = await ReplayTimelineModel.findOneAndUpdate(
    { name: parsed.timeline.name, hazardType: "flood" },
    {
      $set: {
        hazardType: "flood",
        name: parsed.timeline.name,
        description: parsed.timeline.description,
        startsAt: new Date(parsed.timeline.startsAt),
        endsAt: new Date(parsed.timeline.endsAt),
        timestepMinutes: parsed.timeline.timestepMinutes,
        source: {
          ...parsed.timeline.source,
          checksum,
          importedAt: new Date()
        }
      }
    },
    { upsert: true, new: true }
  );

  const operations = parsed.snapshots.map((snapshot) => ({
    updateOne: {
      filter: { timelineId: timeline._id, sequence: snapshot.sequence },
      update: {
        $set: {
          timelineId: timeline._id,
          sequence: snapshot.sequence,
          timestamp: new Date(snapshot.timestamp),
          state: snapshot.state
        }
      },
      upsert: true
    }
  }));

  if (operations.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- import state is generic JSON; schema validates at runtime
    await ReplaySnapshotModel.bulkWrite(operations as any[], { ordered: false });
  }

  await new MongoAuditService().record({
    eventType: "replay.import.completed",
    actorType: "system",
    correlationId: `replay-import:${String(timeline._id)}:${checksum}`,
    hazardType: "flood",
    payload: {
      file: resolvedPath,
      timelineId: String(timeline._id),
      snapshotCount: operations.length,
      checksum
    }
  });

  return { timelineId: String(timeline._id), snapshotCount: operations.length };
}

async function main(): Promise<void> {
  const file = readArg("file");
  if (!file) {
    throw new Error("Required arg: --file");
  }

  await connectMongo();
  try {
    const result = await importReplayFile(file);
    logger.info(result, "Replay import completed");
  } finally {
    await disconnectMongo();
  }
}

if (process.argv[1]?.endsWith("import-replay.ts")) {
  main().catch((error: unknown) => {
    logger.fatal({ err: error }, "Replay import failed");
    process.exit(1);
  });
}
