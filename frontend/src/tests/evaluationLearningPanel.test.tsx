import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EvaluationLearningPanel } from "../components/EvaluationLearningPanel";
import type { EvaluationMetrics, LearningReportData } from "../evaluation/evaluation.types";

afterEach(() => {
  cleanup();
});

const sampleMetrics: EvaluationMetrics = {
  floodIoU: 0.84,
  precision: 0.89,
  recall: 0.91,
  leadTimeHours: 18.5,
  falseAlarmRate: 0.04,
  populationErrorPct: 3.2,
  routeFeasibilityPct: 100.0,
  resourceUtilizationPct: 88.0,
  plannerFeasibilityPct: 96.0
};

const sampleReport: LearningReportData = {
  reportId: "RPT_101",
  timestamp: "2018-08-15T06:00:00.000Z",
  predictedVsActualSummary: {
    predictedAreaKm2: 32.5,
    actualAreaKm2: 35.0,
    iou: 0.84
  },
  plannerSuccesses: [{ actionType: "open_shelter", description: "Assigned evacuees" }],
  plannerFailures: [{ actionType: "cloud_cover", description: "Impaired confidence" }],
  confidenceCalibration: [{ bucket: "0.90 - 1.00", predictedConfidence: 0.94, actualAccuracy: 0.91 }],
  lessonsLearned: ["NDWI band resolution is high"],
  policyRecommendations: ["Integrate SAR imagery"]
};

describe("EvaluationLearningPanel", () => {
  it("renders loading state", () => {
    render(<EvaluationLearningPanel metrics={null} report={null} isLoading={true} />);
    expect(screen.getByText("Loading ground truth evaluation metrics & learning report…")).toBeDefined();
  });

  it("renders 8-stage decision lifecycle stepper and ground truth metrics", () => {
    render(<EvaluationLearningPanel metrics={sampleMetrics} report={sampleReport} isLoading={false} />);

    expect(screen.getByText("Post-Disaster Evaluation & Learning Loop")).toBeDefined();
    expect(screen.getByText("1. Observe")).toBeDefined();
    expect(screen.getByText("8. Learning Report")).toBeDefined();
    expect(screen.getByText("0.84")).toBeDefined();
    expect(screen.getByText("18.5 hrs")).toBeDefined();
    expect(screen.getByText("100%")).toBeDefined();
  });
});
