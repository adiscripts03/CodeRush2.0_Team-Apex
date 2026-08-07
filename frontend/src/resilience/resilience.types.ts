export interface FailureInjection {
  injectionId: string;
  failureType: "comms_tower_outage" | "sensor_data_loss" | "road_network_failure" | "shelter_overflow" | "network_latency";
  targetComponent: string;
  parameters: {
    latencyMs?: number;
    errorRate?: number;
    affectedZones?: string[];
  };
  active: boolean;
  injectedAt: string;
}

export interface ResilienceHealthMetrics {
  status: "healthy" | "degraded" | "impaired";
  activeFailureCount: number;
  activeFailures: Array<{ failureType: string; targetComponent: string }>;
  resilienceIndex: number;
  offlineSyncEnabled: boolean;
  degradedMode: boolean;
  timestamp: string;
}

export interface QueuedOfflineAction {
  id: string;
  type: "approve_recommendation" | "reject_recommendation";
  payload: Record<string, unknown>;
  timestamp: number;
}
