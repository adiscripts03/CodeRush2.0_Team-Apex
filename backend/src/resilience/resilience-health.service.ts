import { getActiveFailures } from "./failure-simulator.engine.js";

export interface ResilienceHealthMetrics {
  status: "healthy" | "degraded" | "impaired";
  activeFailureCount: number;
  activeFailures: Array<{ failureType: string; targetComponent: string }>;
  resilienceIndex: number; // 0 to 100
  offlineSyncEnabled: boolean;
  degradedMode: boolean;
  timestamp: string;
}

export async function getResilienceHealthMetrics(): Promise<ResilienceHealthMetrics> {
  const failures = await getActiveFailures();
  const count = failures.length;

  let resilienceIndex = 100;
  if (count > 0) {
    resilienceIndex = Math.max(20, 100 - count * 20);
  }

  const status = count === 0 ? "healthy" : count <= 2 ? "degraded" : "impaired";

  return {
    status,
    activeFailureCount: count,
    activeFailures: failures.map((f) => ({
      failureType: f.failureType,
      targetComponent: f.targetComponent
    })),
    resilienceIndex,
    offlineSyncEnabled: true,
    degradedMode: count > 0,
    timestamp: new Date().toISOString()
  };
}
