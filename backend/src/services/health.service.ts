import { getMongoStatus } from "../db/mongo.js";

export interface HealthResponse {
  service: "kerala-floods-eoc-backend";
  status: "ok";
  timestamp: string;
  dependencies: {
    mongo: {
      status: ReturnType<typeof getMongoStatus>;
    };
  };
}

export function getHealth(): HealthResponse {
  return {
    service: "kerala-floods-eoc-backend",
    status: "ok",
    timestamp: new Date().toISOString(),
    dependencies: {
      mongo: {
        status: getMongoStatus()
      }
    }
  };
}
