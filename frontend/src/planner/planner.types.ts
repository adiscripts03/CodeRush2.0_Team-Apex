export type ActionType =
  | "open_shelter"
  | "deploy_rescue_boats"
  | "close_road"
  | "send_medical_team"
  | "prioritize_district"
  | "schedule_review";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export interface EvidenceItem {
  metric: string;
  value: string | number;
  source: string;
}

export interface AlternativeItem {
  action: string;
  tradeOff: string;
}

export interface PlanRecommendation {
  _id?: string;
  recommendationId: string;
  timestamp: string;
  actionType: ActionType;
  targetName: string;
  targetId?: string;
  priority: PriorityLevel;
  reasoning: string[];
  evidence: EvidenceItem[];
  confidenceScore: number;
  constraints: string[];
  alternatives: AlternativeItem[];
  status: "proposed" | "approved" | "rejected" | "executed";
}

export interface DecisionLoopStage {
  stage: "observe" | "estimate" | "explain" | "plan" | "review";
  summary: string;
  data: Record<string, unknown>;
}

export interface DecisionLoopRunResponse {
  timestamp: string;
  stages: DecisionLoopStage[];
  recommendations: PlanRecommendation[];
  confidence: number;
  uncertaintyFactors: string[];
}
