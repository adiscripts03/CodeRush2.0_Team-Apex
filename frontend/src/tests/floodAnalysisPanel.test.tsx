import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FloodAnalysisPanel } from "../components/FloodAnalysisPanel";
import type { ChangeDetectionResponse, FloodSnapshot } from "../flood/flood.types";

afterEach(() => {
  cleanup();
});

const sampleSnapshot: FloodSnapshot = {
  _id: "snap-101",
  timestamp: "2018-08-15T06:00:00.000Z",
  sourceImageId: "SENTINEL2_20180815_KERALA",
  totalAreaKm2: 42.5,
  polygonCount: 3,
  confidenceScore: 0.88,
  status: "processed"
};

const sampleChange: ChangeDetectionResponse = {
  timestampFrom: "2018-08-15T00:00:00.000Z",
  timestampTo: "2018-08-15T06:00:00.000Z",
  timeDeltaHours: 6.0,
  areaFromKm2: 20.0,
  areaToKm2: 42.5,
  netChangeKm2: 22.5,
  expandedAreaKm2: 25.0,
  recededAreaKm2: 2.5,
  persistedAreaKm2: 17.5,
  expansionRateKm2PerHour: 4.17,
  expandedFeatures: { type: "FeatureCollection", features: [] },
  recededFeatures: { type: "FeatureCollection", features: [] },
  persistedFeatures: { type: "FeatureCollection", features: [] }
};

describe("FloodAnalysisPanel", () => {
  it("renders loading state", () => {
    render(
      <FloodAnalysisPanel
        snapshot={null}
        changeData={null}
        showChangeOverlay={true}
        isLoading={true}
        onToggleChangeOverlay={() => {}}
      />
    );
    expect(screen.getByText("Loading flood intelligence data…")).toBeDefined();
  });

  it("renders active flood snapshot metrics and confidence score", () => {
    render(
      <FloodAnalysisPanel
        snapshot={sampleSnapshot}
        changeData={null}
        showChangeOverlay={true}
        isLoading={false}
        onToggleChangeOverlay={() => {}}
      />
    );
    expect(screen.getByText("Flood Intelligence Engine (NDWI)")).toBeDefined();
    expect(screen.getByText("42.5 km²")).toBeDefined();
    expect(screen.getByText("3 polygons")).toBeDefined();
    expect(screen.getByText("Confidence: 88%")).toBeDefined();
  });

  it("renders change detection metrics when changeData is present", () => {
    render(
      <FloodAnalysisPanel
        snapshot={sampleSnapshot}
        changeData={sampleChange}
        showChangeOverlay={true}
        isLoading={false}
        onToggleChangeOverlay={() => {}}
      />
    );
    expect(screen.getByText("Change Detection (vs Previous Snapshot)")).toBeDefined();
    expect(screen.getByText("+25.0 km²")).toBeDefined();
    expect(screen.getByText("-2.5 km²")).toBeDefined();
    expect(screen.getByText("4.2 km²/h")).toBeDefined();
  });
});
