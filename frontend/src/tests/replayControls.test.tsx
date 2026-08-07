import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ReplayControls } from "../components/ReplayControls";
import { SnapshotPanel } from "../components/SnapshotPanel";
import type { ReplaySnapshot, ReplayTimeline } from "../replay/replay.types";

afterEach(() => {
  cleanup();
});

const noop = () => {};

function makeTimeline(overrides: Partial<ReplayTimeline> = {}): ReplayTimeline {
  return {
    _id: "000000000000000000000001",
    name: "Kerala Floods 2018 Sample Replay",
    description: "Test timeline",
    startsAt: "2018-08-15T00:00:00.000Z",
    endsAt: "2018-08-15T12:00:00.000Z",
    timestepMinutes: 360,
    ...overrides
  };
}

function makeSnapshot(overrides: Partial<ReplaySnapshot> = {}): ReplaySnapshot {
  return {
    _id: "000000000000000000000010",
    timelineId: "000000000000000000000001",
    sequence: 1,
    timestamp: "2018-08-15T06:00:00.000Z",
    state: {
      weather: { rainfallMm: 141, condition: "extreme_rain" },
      riverLevels: [{ station: "Periyar", levelMeters: 4.6, trend: "rising" }],
      notes: "Flood extent expands.",
      floodExtent: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { depthMeters: 0.9 },
            geometry: {
              type: "Polygon",
              coordinates: [[[76.22, 9.92], [76.38, 9.92], [76.38, 10.08], [76.22, 10.08], [76.22, 9.92]]]
            }
          }
        ]
      }
    },
    ...overrides
  };
}

const defaultProps = {
  timeline: null as ReplayTimeline | null,
  snapshot: null as ReplaySnapshot | null,
  timestampMs: null as number | null,
  sliderValue: 0,
  isPlaying: false,
  speed: 1,
  isLoading: false,
  error: null as string | null,
  onPlay: noop,
  onPause: noop,
  onSeek: noop,
  onSpeedChange: noop,
  onStepForward: noop,
  onStepBackward: noop
};

describe("ReplayControls", () => {
  it("shows loading state", () => {
    render(<ReplayControls {...defaultProps} isLoading={true} />);
    expect(screen.getByText("loading")).toBeDefined();
  });

  it("shows error state", () => {
    render(<ReplayControls {...defaultProps} error="Connection failed" />);
    expect(screen.getByText("sync issue")).toBeDefined();
  });

  it("shows timeline name when loaded", () => {
    const timeline = makeTimeline();
    render(<ReplayControls {...defaultProps} timeline={timeline} />);
    expect(screen.getByText("Kerala Floods 2018 Sample Replay")).toBeDefined();
  });

  it("shows no timeline message when not loaded", () => {
    render(<ReplayControls {...defaultProps} />);
    expect(screen.getByText("No replay timeline loaded")).toBeDefined();
  });

  it("shows Play button when not playing", () => {
    const timeline = makeTimeline();
    render(<ReplayControls {...defaultProps} timeline={timeline} isPlaying={false} />);
    expect(screen.getByText("▶ Play")).toBeDefined();
  });

  it("shows Pause button when playing", () => {
    const timeline = makeTimeline();
    render(<ReplayControls {...defaultProps} timeline={timeline} isPlaying={true} />);
    expect(screen.getByText("⏸ Pause")).toBeDefined();
  });

  it("shows snapshot sequence when a snapshot is loaded", () => {
    const snapshot = makeSnapshot({ sequence: 2 });
    render(<ReplayControls {...defaultProps} snapshot={snapshot} />);
    expect(screen.getByText("snapshot 2")).toBeDefined();
  });

  it("shows speed buttons including 8x", () => {
    render(<ReplayControls {...defaultProps} />);
    expect(screen.getByText("1x")).toBeDefined();
    expect(screen.getByText("2x")).toBeDefined();
    expect(screen.getByText("4x")).toBeDefined();
    expect(screen.getByText("8x")).toBeDefined();
  });

  it("shows step forward and backward buttons", () => {
    render(<ReplayControls {...defaultProps} />);
    expect(screen.getByLabelText("Step backward")).toBeDefined();
    expect(screen.getByLabelText("Step forward")).toBeDefined();
  });

  it("shows timeline start and end times when timeline is loaded", () => {
    const timeline = makeTimeline();
    render(<ReplayControls {...defaultProps} timeline={timeline} />);
    const container = screen.getByLabelText("Replay timestamp").closest("div")!;
    expect(container).toBeDefined();
  });

  it("disables buttons when no timeline is loaded", () => {
    render(<ReplayControls {...defaultProps} />);
    const playButton = screen.getByText("▶ Play");
    expect(playButton.closest("button")?.disabled).toBe(true);
  });

  it("shows slider percentage", () => {
    render(<ReplayControls {...defaultProps} sliderValue={42} />);
    expect(screen.getByText("42%")).toBeDefined();
  });
});

describe("SnapshotPanel", () => {
  it("shows loading state", () => {
    render(<SnapshotPanel snapshot={null} isLoading={true} />);
    expect(screen.getByText("Loading snapshot…")).toBeDefined();
  });

  it("shows no snapshot message when not loaded", () => {
    render(<SnapshotPanel snapshot={null} isLoading={false} />);
    expect(screen.getByText(/No snapshot loaded/)).toBeDefined();
  });

  it("shows snapshot sequence number", () => {
    const snapshot = makeSnapshot({ sequence: 1 });
    render(<SnapshotPanel snapshot={snapshot} isLoading={false} />);
    expect(screen.getByText("Snapshot #1")).toBeDefined();
  });

  it("shows weather information", () => {
    const snapshot = makeSnapshot();
    render(<SnapshotPanel snapshot={snapshot} isLoading={false} />);
    expect(screen.getByText("Weather")).toBeDefined();
    expect(screen.getByText("💧 141 mm")).toBeDefined();
  });

  it("shows river level information", () => {
    const snapshot = makeSnapshot();
    render(<SnapshotPanel snapshot={snapshot} isLoading={false} />);
    expect(screen.getByText("River Levels")).toBeDefined();
    expect(screen.getByText("Periyar")).toBeDefined();
    expect(screen.getByText("4.6 m")).toBeDefined();
  });

  it("shows flood extent zone count", () => {
    const snapshot = makeSnapshot();
    render(<SnapshotPanel snapshot={snapshot} isLoading={false} />);
    expect(screen.getByText("Flood Extent")).toBeDefined();
    expect(screen.getByText("1 zone affected")).toBeDefined();
  });

  it("shows notes", () => {
    const snapshot = makeSnapshot();
    render(<SnapshotPanel snapshot={snapshot} isLoading={false} />);
    expect(screen.getByText("Flood extent expands.")).toBeDefined();
  });

  it("uses plural zones for multiple features", () => {
    const snapshot = makeSnapshot({
      state: {
        floodExtent: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } },
            { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [1, 1] } }
          ]
        }
      }
    });
    render(<SnapshotPanel snapshot={snapshot} isLoading={false} />);
    expect(screen.getByText("2 zones affected")).toBeDefined();
  });
});
