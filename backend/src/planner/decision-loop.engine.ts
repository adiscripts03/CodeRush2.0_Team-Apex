import { generateRecommendations, type RecommendationDraft, type PlannerInputData } from "./recommendation-generator.js";

export interface DecisionLoopStageResult {
  stage: "observe" | "estimate" | "explain" | "plan" | "review";
  summary: string;
  data: Record<string, unknown>;
}

export interface DecisionLoopRunOutput {
  timestamp: Date;
  stages: DecisionLoopStageResult[];
  recommendations: RecommendationDraft[];
  confidence: number;
  uncertaintyFactors: string[];
}

export function executeDecisionLoop(inputData: PlannerInputData): DecisionLoopRunOutput {
  const timestamp = inputData.timestamp;

  // 1. Observe Stage
  const observeStage: DecisionLoopStageResult = {
    stage: "observe",
    summary: `Observed Sentinel-2 satellite flood snapshot (${inputData.floodAreaKm2.toFixed(1)} km²) and GIS infrastructure layers`,
    data: {
      floodAreaKm2: inputData.floodAreaKm2,
      sensorConfidence: inputData.confidenceScore,
      timestamp: timestamp.toISOString()
    }
  };

  // 2. Estimate Stage
  const estimateStage: DecisionLoopStageResult = {
    stage: "estimate",
    summary: `Estimated ${inputData.affectedPopulation.toLocaleString()} affected population, ${inputData.blockedRoadCount} blocked roads (${inputData.blockedRoadLengthKm.toFixed(1)} km), and ${inputData.shelterDemand.toLocaleString()} shelter demand`,
    data: {
      affectedPopulation: inputData.affectedPopulation,
      shelterDemand: inputData.shelterDemand,
      openShelterCapacity: inputData.openShelterCapacity,
      blockedRoadsKm: inputData.blockedRoadLengthKm
    }
  };

  // 3. Explain Stage
  const uncertaintyFactors: string[] = [];
  if (inputData.confidenceScore < 0.85) {
    uncertaintyFactors.push("High satellite cloud cover fraction in eastern highlands");
  }
  if (inputData.availableBoats < 5) {
    uncertaintyFactors.push("Limited rescue boat fleet availability");
  }

  const explainStage: DecisionLoopStageResult = {
    stage: "explain",
    summary: `Assessed overall decision confidence at ${(inputData.confidenceScore * 100).toFixed(0)}% with ${uncertaintyFactors.length} uncertainty factor(s)`,
    data: {
      confidence: inputData.confidenceScore,
      uncertaintyFactors
    }
  };

  // 4. Plan Stage
  const recommendations = generateRecommendations(inputData);
  const planStage: DecisionLoopStageResult = {
    stage: "plan",
    summary: `Generated ${recommendations.length} constraint-bounded action recommendation(s)`,
    data: {
      recommendationCount: recommendations.length,
      actionTypes: recommendations.map((r) => r.actionType)
    }
  };

  // 5. Review Stage
  const reviewStage: DecisionLoopStageResult = {
    stage: "review",
    summary: "Established human approval workflow requirement and review criteria for action execution",
    data: {
      reviewCriteria: [
        "Human Commander explicit approval required for boat deployment & road closure",
        "Verify shelter capacity before dispatching evacuees",
        "Re-evaluate in 6 hours upon next satellite pass"
      ]
    }
  };

  return {
    timestamp,
    stages: [observeStage, estimateStage, explainStage, planStage, reviewStage],
    recommendations,
    confidence: inputData.confidenceScore,
    uncertaintyFactors
  };
}
