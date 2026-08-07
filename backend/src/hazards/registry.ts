import { floodHazardModule } from "./flood/index.js";
import type { HazardModule } from "./hazard.types.js";

const hazardModules = [floodHazardModule] as const;

export function listHazards(): readonly HazardModule[] {
  return hazardModules;
}

export function getHazard(type: string): HazardModule | undefined {
  return hazardModules.find((hazard) => hazard.type === type);
}
