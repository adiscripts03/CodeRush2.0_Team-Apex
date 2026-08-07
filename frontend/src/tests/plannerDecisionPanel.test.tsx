import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PlannerDecisionPanel } from "../components/PlannerDecisionPanel";
import type { PlanRecommendation } from "../planner/planner.types";

afterEach(() => {
  cleanup();
});

const sampleRecommendations: PlanRecommendation[] = [
  {
    recommendationId: "REC_101",
    timestamp: "2018-08-15T06:00:00.000Z",
    actionType: "open_shelter",
    targetName: "Kaloor Stadium Relief Camp",
    targetId: "SHELTER_KALOOR",
    priority: "critical",
    reasoning: ["Shelter demand (9,000) exceeds open capacity (3,500)"],
    evidence: [{ metric: "Shelter Demand", value: 9000, source: "Impact Engine" }],
    confidenceScore: 0.92,
    constraints: ["Requires 500 food packs"],
    alternatives: [{ action: "Inter-district transfer", tradeOff: "Longer travel time" }],
    status: "proposed"
  },
  {
    recommendationId: "REC_102",
    timestamp: "2018-08-15T06:00:00.000Z",
    actionType: "deploy_rescue_boats",
    targetName: "NDRF Motorised Boat Squad",
    targetId: "BOAT_NDRF",
    priority: "high",
    reasoning: ["Flooded area 35.0 km² requires water evacuation"],
    evidence: [{ metric: "Flooded Area", value: "35 km²", source: "NDWI Engine" }],
    confidenceScore: 0.88,
    constraints: ["Fleet limit 12 boats"],
    alternatives: [{ action: "Air drop", tradeOff: "Cannot evacuate patients" }],
    status: "proposed"
  }
];

describe("PlannerDecisionPanel", () => {
  it("renders loading state", () => {
    render(<PlannerDecisionPanel recommendations={[]} isLoading={true} />);
    expect(screen.getByText("Synthesizing decision loop recommendations…")).toBeDefined();
  });

  it("renders 5-step decision loop stepper and recommendation count", () => {
    render(<PlannerDecisionPanel recommendations={sampleRecommendations} isLoading={false} />);
    expect(screen.getByText("Agentic Decision Planner")).toBeDefined();
    expect(screen.getByText("1. Observe")).toBeDefined();
    expect(screen.getByText("2. Estimate")).toBeDefined();
    expect(screen.getByText("3. Explain")).toBeDefined();
    expect(screen.getByText("4. Plan")).toBeDefined();
    expect(screen.getByText("5. Review")).toBeDefined();
    expect(screen.getByText("Action Recommendations (2)")).toBeDefined();
  });

  it("renders recommendation cards with priority badges and targets", () => {
    render(<PlannerDecisionPanel recommendations={sampleRecommendations} isLoading={false} />);
    expect(screen.getByText("Kaloor Stadium Relief Camp")).toBeDefined();
    expect(screen.getByText("NDRF Motorised Boat Squad")).toBeDefined();
    expect(screen.getByText("CRITICAL")).toBeDefined();
    expect(screen.getByText("HIGH")).toBeDefined();
  });
});
