import { describe, expect, it } from "vitest";
import { getHazard, listHazards } from "../hazards/registry.js";

describe("hazard registry", () => {
  it("registers flood as the first hazard module", () => {
    expect(listHazards()).toHaveLength(1);
    expect(getHazard("flood")?.displayName).toBe("Flood");
  });

  it("does not register future hazards in milestone 1", () => {
    expect(getHazard("wildfire")).toBeUndefined();
  });
});
