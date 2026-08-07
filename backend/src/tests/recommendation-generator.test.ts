import { describe, it, expect } from "vitest";
import { generateRecommendations, type PlannerInputData } from "../planner/recommendation-generator.js";

const sampleInput: PlannerInputData = {
  timestamp: new Date("2018-08-15T06:00:00.000Z"),
  floodAreaKm2: 35.0,
  confidenceScore: 0.88,
  affectedPopulation: 45_000,
  blockedRoadCount: 6,
  blockedRoadLengthKm: 14.5,
  affectedHospitalCount: 2,
  shelterDemand: 9_000,
  openShelterCapacity: 3_500, // Deficit: 5,500
  availableBoats: 10,
  districtName: "Ernakulam",
  shelters: [
    { shelterId: "SHELTER_KALOOR", name: "Kaloor Stadium Relief Camp", status: "open", availableCapacity: 2000 }
  ],
  blockedRoads: [
    { facilityId: "ROAD_NH66", facilityName: "NH-66 Aluva Highway" }
  ]
};

describe("generateRecommendations", () => {
  it("generates evidence-backed recommendations for all applicable hazard conditions", () => {
    const recs = generateRecommendations(sampleInput);

    expect(recs.length).toBeGreaterThanOrEqual(5);

    const actionTypes = recs.map((r) => r.actionType);
    expect(actionTypes).toContain("open_shelter");
    expect(actionTypes).toContain("deploy_rescue_boats");
    expect(actionTypes).toContain("close_road");
    expect(actionTypes).toContain("send_medical_team");
    expect(actionTypes).toContain("prioritize_district");
    expect(actionTypes).toContain("schedule_review");
  });

  it("prevents duplicate recommendations for the same target", () => {
    const recs = generateRecommendations(sampleInput);
    const uniqueKeys = new Set(recs.map((r) => `${r.actionType}:${r.targetId}`));
    expect(recs.length).toBe(uniqueKeys.size);
  });

  it("populates reasoning steps, evidence, constraints, and alternatives for every recommendation", () => {
    const recs = generateRecommendations(sampleInput);

    for (const rec of recs) {
      expect(rec.reasoning.length).toBeGreaterThan(0);
      expect(rec.evidence.length).toBeGreaterThan(0);
      expect(rec.constraints.length).toBeGreaterThan(0);
      expect(rec.alternatives.length).toBeGreaterThan(0);
      expect(rec.confidenceScore).toBeGreaterThan(0);
      expect(["low", "medium", "high", "critical"]).toContain(rec.priority);
    }
  });

  it("satisfies shelter capacity deficit constraint logic", () => {
    const recs = generateRecommendations(sampleInput);
    const openShelterRec = recs.find((r) => r.actionType === "open_shelter");

    expect(openShelterRec).toBeDefined();
    expect(openShelterRec?.priority).toBe("critical"); // deficit > 5000
    expect(openShelterRec?.evidence.some((e) => e.metric === "Shelter Demand")).toBe(true);
  });
});
