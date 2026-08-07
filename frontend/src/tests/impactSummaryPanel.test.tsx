import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ImpactSummaryPanel } from "../components/ImpactSummaryPanel";
import type { ImpactAssessment } from "../impact/impact.types";

afterEach(() => {
  cleanup();
});

const sampleImpact: ImpactAssessment = {
  _id: "impact-101",
  timestamp: "2018-08-15T06:00:00.000Z",
  snapshotId: "snap-101",
  affectedPopulationCount: 45_000,
  blockedRoadCount: 8,
  blockedRoadLengthKm: 18.5,
  affectedHospitalCount: 3,
  affectedShelterCount: 2,
  affectedSchoolCount: 4,
  totalCriticalFacilities: 9,
  shelterDemandEstimate: 9_000,
  severityScore: 0.72,
  severityLevel: "high",
  districtBreakdown: [
    { district: "Ernakulam", affectedPopulation: 25_000, floodedAreaKm2: 18.2 },
    { district: "Thrissur", affectedPopulation: 20_000, floodedAreaKm2: 12.5 }
  ]
};

describe("ImpactSummaryPanel", () => {
  it("renders loading state", () => {
    render(<ImpactSummaryPanel impact={null} isLoading={true} />);
    expect(screen.getByText("Evaluating flood impact assessment…")).toBeDefined();
  });

  it("renders empty state when no impact available", () => {
    render(<ImpactSummaryPanel impact={null} isLoading={false} />);
    expect(screen.getByText("No impact assessment available for current flood state.")).toBeDefined();
  });

  it("renders severity level badge and metrics", () => {
    render(<ImpactSummaryPanel impact={sampleImpact} isLoading={false} />);
    expect(screen.getByText("Impact Assessment Engine")).toBeDefined();
    expect(screen.getByText("Severity: HIGH (72%)")).toBeDefined();
    expect(screen.getByText("45,000")).toBeDefined();
    expect(screen.getByText("9,000")).toBeDefined();
    expect(screen.getByText("18.5 km")).toBeDefined();
    expect(screen.getByText("9")).toBeDefined();
  });

  it("renders district exposure breakdown table", () => {
    render(<ImpactSummaryPanel impact={sampleImpact} isLoading={false} />);
    expect(screen.getByText("District Exposure Breakdown")).toBeDefined();
    expect(screen.getByText("Ernakulam")).toBeDefined();
    expect(screen.getByText("25,000")).toBeDefined();
    expect(screen.getByText("Thrissur")).toBeDefined();
  });
});
