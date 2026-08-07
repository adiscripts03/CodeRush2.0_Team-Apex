import type { HazardModule } from "../hazard.types.js";

export const floodHazardModule: HazardModule = {
  type: "flood",
  displayName: "Flood",
  version: "0.1.0",
  enabled: true,
  capabilities: ["traceability_foundation"]
};
