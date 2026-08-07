export interface EvaluationMetrics {
  floodIoU: number;
  precision: number;
  recall: number;
  leadTimeHours: number;
  falseAlarmRate: number;
  populationErrorPct: number;
  routeFeasibilityPct: number;
  resourceUtilizationPct: number;
  plannerFeasibilityPct: number;
}

export interface EvaluationResultData {
  evaluationId: string;
  timestamp: string;
  metrics: EvaluationMetrics;
}

export interface CalibrationPoint {
  bucket: string;
  predictedConfidence: number;
  actualAccuracy: number;
}

export interface LearningReportData {
  reportId: string;
  timestamp: string;
  predictedVsActualSummary: {
    predictedAreaKm2: number;
    actualAreaKm2: number;
    iou: number;
  };
  plannerSuccesses: Array<{ actionType: string; description: string }>;
  plannerFailures: Array<{ actionType: string; description: string }>;
  confidenceCalibration: CalibrationPoint[];
  lessonsLearned: string[];
  policyRecommendations: string[];
}
