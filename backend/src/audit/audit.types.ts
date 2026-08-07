export type AuditActorType = "system" | "human" | "sensor" | "planner" | "simulation";
export type AuditSeverity = "debug" | "info" | "warn" | "error" | "critical";
export type HazardType = "flood" | "wildfire" | "landslide" | "cyclone" | "earthquake";

export interface AuditEventInput {
  eventType: string;
  actorType: AuditActorType;
  actorId?: string;
  correlationId: string;
  hazardType?: HazardType;
  severity?: AuditSeverity;
  payload?: Record<string, unknown>;
}
