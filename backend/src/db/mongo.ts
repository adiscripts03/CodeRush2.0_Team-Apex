import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../logging/logger.js";

export type MongoStatus = "connected" | "connecting" | "disconnected" | "disconnecting";

const readyStateMap: Record<number, MongoStatus> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};

export function getMongoStatus(): MongoStatus {
  return readyStateMap[mongoose.connection.readyState] ?? "disconnected";
}

export async function connectMongo(): Promise<void> {
  if (getMongoStatus() === "connected") {
    return;
  }

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    autoIndex: env.NODE_ENV !== "production"
  });

  logger.info({ dbName: env.MONGODB_DB_NAME }, "MongoDB connected");
}

export async function disconnectMongo(): Promise<void> {
  if (getMongoStatus() === "disconnected") {
    return;
  }

  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
