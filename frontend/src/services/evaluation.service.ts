import { frontendEnv } from "../config/env";
import type { CalibrationPoint, EvaluationResultData, LearningReportData } from "../evaluation/evaluation.types";

export async function fetchEvaluationMetrics(timestampIso?: string): Promise<EvaluationResultData> {
  const url = timestampIso
    ? `${frontendEnv.apiBaseUrl}/api/evaluation?timestamp=${encodeURIComponent(timestampIso)}`
    : `${frontendEnv.apiBaseUrl}/api/evaluation`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch evaluation metrics failed with status ${response.status}`);
  }
  return response.json() as Promise<EvaluationResultData>;
}

export async function fetchLearningReport(timestampIso?: string): Promise<LearningReportData> {
  const url = timestampIso
    ? `${frontendEnv.apiBaseUrl}/api/evaluation/report?timestamp=${encodeURIComponent(timestampIso)}`
    : `${frontendEnv.apiBaseUrl}/api/evaluation/report`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch learning report failed with status ${response.status}`);
  }
  return response.json() as Promise<LearningReportData>;
}

export async function fetchCalibrationCurve(): Promise<CalibrationPoint[]> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/evaluation/calibration`);
  if (!response.ok) {
    throw new Error(`Fetch calibration curve failed with status ${response.status}`);
  }
  const body = (await response.json()) as { calibration: CalibrationPoint[] };
  return body.calibration;
}
