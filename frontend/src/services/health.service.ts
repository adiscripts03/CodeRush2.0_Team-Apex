import { frontendEnv } from "../config/env";

export interface BackendHealth {
  service: string;
  status: "ok";
  timestamp: string;
  dependencies: {
    mongo: {
      status: "connected" | "connecting" | "disconnected" | "disconnecting";
    };
  };
}

export function formatMongoStatus(status: BackendHealth["dependencies"]["mongo"]["status"]): string {
  return status.replace("_", " ");
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<BackendHealth>;
}
