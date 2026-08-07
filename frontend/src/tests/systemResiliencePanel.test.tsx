import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SystemResiliencePanel } from "../components/SystemResiliencePanel";
import type { FailureInjection, ResilienceHealthMetrics } from "../resilience/resilience.types";

afterEach(() => {
  cleanup();
});

const sampleHealth: ResilienceHealthMetrics = {
  status: "degraded",
  activeFailureCount: 1,
  activeFailures: [{ failureType: "comms_tower_outage", targetComponent: "telemetry_gateway" }],
  resilienceIndex: 80,
  offlineSyncEnabled: true,
  degradedMode: true,
  timestamp: "2018-08-15T06:00:00.000Z"
};

const sampleFailures: FailureInjection[] = [
  {
    injectionId: "FAIL_101",
    failureType: "comms_tower_outage",
    targetComponent: "telemetry_gateway",
    parameters: { errorRate: 0.8 },
    active: true,
    injectedAt: "2018-08-15T06:00:00.000Z"
  }
];

describe("SystemResiliencePanel", () => {
  it("renders loading state", () => {
    render(
      <SystemResiliencePanel
        resilienceHealth={null}
        activeFailures={[]}
        offlineQueueCount={0}
        isLoading={true}
      />
    );
    expect(screen.getByText("Checking system resilience & failure simulator state…")).toBeDefined();
  });

  it("renders failure simulator controls and resilience index", () => {
    const handleInject = vi.fn();
    const handleClear = vi.fn();

    render(
      <SystemResiliencePanel
        resilienceHealth={sampleHealth}
        activeFailures={sampleFailures}
        offlineQueueCount={2}
        isLoading={false}
        onInjectFailure={handleInject}
        onClearFailures={handleClear}
      />
    );

    expect(screen.getByText("Resilience, Failure Simulation & Offline Sync")).toBeDefined();
    expect(screen.getByText("Resilience Index: 80%")).toBeDefined();
    expect(screen.getByText("+ Comms Outage")).toBeDefined();
    expect(screen.getByText("2 action(s) pending")).toBeDefined();
  });
});
