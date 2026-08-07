import { AuditEventModel } from "../models/audit-event.model.js";
import type { AuditEventInput } from "./audit.types.js";

export interface AuditService {
  record(event: AuditEventInput): Promise<void>;
}

export class MongoAuditService implements AuditService {
  public async record(event: AuditEventInput): Promise<void> {
    await AuditEventModel.create({
      severity: "info",
      payload: {},
      ...event
    });
  }
}
