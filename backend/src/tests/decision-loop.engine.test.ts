import { describe, it, expect } from "vitest";
import { executeDecisionLoop } from "../planner/decision-loop.engine.js";

describe("executeDecisionLoop", () => {
  it("executes all 5 decision loop stages sequentially", () => {
    const loopResult = executeDecisionLoop({
      timestamp: new Date("2018-08-15T06:00:00.000Z"),
      floodAreaKm2: 30.0,
      confidenceScore: 0.82, // triggers cloud cover uncertainty factor
      affectedPopulation: 40_000,
      blockedRoadCount: 4,
      blockedRoadLengthKm: 12.0,
      affectedHospitalCount: 1,
      shelterDemand: 8_000,
      openShelterCapacity: 2_000,
      availableBoats: 3 // triggers boat availability uncertainty factor
    });

    expect(loopResult.stages).toHaveLength(5);
    const stageNames = loopResult.stages.map((s) => s.stage);
    expect(stageNames).toEqual(["observe", "estimate", "explain", "plan", "review"]);

    expect(loopResult.uncertaintyFactors.length).toBeGreaterThan(0);
    expect(loopResult.recommendations.length).toBeGreaterThan(0);
  });
});
