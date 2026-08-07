import type { HazardType } from "../audit/audit.types.js";

export interface HazardModule {
  type: HazardType;
  displayName: string;
  version: string;
  enabled: boolean;
  capabilities: readonly string[];
}
