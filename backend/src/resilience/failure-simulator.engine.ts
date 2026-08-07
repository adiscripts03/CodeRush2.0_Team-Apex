import { MongoAuditService } from "../audit/audit.service.js";
import { FailureInjectionModel, type FailureInjection } from "../models/failure-injection.model.js";

const auditService = new MongoAuditService();

export interface InjectFailureInput {
  failureType: "comms_tower_outage" | "sensor_data_loss" | "road_network_failure" | "shelter_overflow" | "network_latency";
  targetComponent?: string;
  latencyMs?: number;
  errorRate?: number;
  affectedZones?: string[];
}

export async function injectFailure(input: InjectFailureInput): Promise<FailureInjection> {
  const injectionId = `FAIL_${input.failureType.toUpperCase()}_${Date.now()}`;
  const targetComponent = input.targetComponent || "core_telemetry";

  const doc = await FailureInjectionModel.create({
    injectionId,
    failureType: input.failureType,
    targetComponent,
    parameters: {
      latencyMs: input.latencyMs || (input.failureType === "network_latency" ? 1500 : 0),
      errorRate: input.errorRate || (input.failureType === "comms_tower_outage" ? 0.8 : 0),
      affectedZones: input.affectedZones || ["Ernakulam"]
    },
    active: true,
    injectedAt: new Date()
  });

  await auditService.record({
    eventType: "simulation.failure.injected",
    actorType: "system",
    correlationId: `sim-inject:${injectionId}`,
    hazardType: "flood",
    payload: { injectionId, failureType: input.failureType, targetComponent }
  });

  return doc.toObject();
}

export async function clearFailures(): Promise<{ clearedCount: number }> {
  const res = await FailureInjectionModel.updateMany({ active: true }, { $set: { active: false } });

  await auditService.record({
    eventType: "simulation.failures.cleared",
    actorType: "system",
    correlationId: `sim-clear:${Date.now()}`,
    hazardType: "flood",
    payload: { clearedCount: res.modifiedCount }
  });

  return { clearedCount: res.modifiedCount };
}

export async function getActiveFailures(): Promise<FailureInjection[]> {
  return FailureInjectionModel.find({ active: true }).lean();
}

export async function isFailureActive(failureType: string): Promise<boolean> {
  const count = await FailureInjectionModel.countDocuments({ active: true, failureType });
  return count > 0;
}
