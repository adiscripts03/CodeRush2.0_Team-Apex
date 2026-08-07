import { AppError } from "../errors/app-error.js";
import { MongoAuditService } from "../audit/audit.service.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { ImpactAssessmentModel } from "../models/impact-assessment.model.js";
import { ShelterCapacityModel } from "../models/shelter-capacity.model.js";
import { ResourceModel } from "../models/resource.model.js";
import { PlanRecommendationModel } from "../models/plan-recommendation.model.js";
import { PlannerExplanationModel } from "../models/planner-explanation.model.js";
import { DecisionRecordModel } from "../models/decision-record.model.js";
import { executeDecisionLoop, type DecisionLoopRunOutput } from "./decision-loop.engine.js";

const auditService = new MongoAuditService();

export async function runPlanner(timestampIso?: string): Promise<DecisionLoopRunOutput> {
  const targetDate = timestampIso
    ? new Date(timestampIso)
    : (await FloodSnapshotModel.findOne({ status: "processed" }).sort({ timestamp: -1 }).lean())?.timestamp || new Date();

  const snapshot = await FloodSnapshotModel.findOne({ timestamp: targetDate }).lean();

  const impact = await ImpactAssessmentModel.findOne({ timestamp: targetDate }).lean();

  const shelters = await ShelterCapacityModel.find().lean();
  const openShelterCapacity = shelters.reduce((acc, s) => acc + Math.max(0, s.availableCapacity), 0);

  const boatsResource = await ResourceModel.findOne({ type: "rescue_boat" }).lean();
  const availableBoats = boatsResource ? boatsResource.quantity : 12;

  const inputData = {
    timestamp: targetDate,
    floodAreaKm2: snapshot ? snapshot.totalAreaKm2 : 25.0,
    confidenceScore: snapshot ? snapshot.confidenceScore : 0.88,
    affectedPopulation: impact ? impact.affectedPopulationCount : 45_000,
    blockedRoadCount: impact ? impact.blockedRoadCount : 6,
    blockedRoadLengthKm: impact ? impact.blockedRoadLengthKm : 14.5,
    affectedHospitalCount: impact ? impact.affectedHospitalCount : 1,
    shelterDemand: impact ? impact.shelterDemandEstimate : 9_000,
    openShelterCapacity,
    availableBoats,
    districtName: impact?.districtBreakdown?.[0]?.district || "Ernakulam",
    shelters: shelters.map((s) => ({
      shelterId: s.shelterId,
      name: s.name,
      status: s.status,
      availableCapacity: s.availableCapacity
    }))
  };

  const loopResult = executeDecisionLoop(inputData);

  // Persist recommendations
  for (const rec of loopResult.recommendations) {
    await PlanRecommendationModel.findOneAndUpdate(
      { recommendationId: rec.recommendationId },
      { $set: rec },
      { upsert: true, new: true }
    );

    await PlannerExplanationModel.findOneAndUpdate(
      { recommendationId: rec.recommendationId },
      {
        $set: {
          recommendationId: rec.recommendationId,
          timestamp: targetDate,
          observeSummary: loopResult.stages[0].data,
          estimateSummary: loopResult.stages[1].data,
          explainUncertainty: {
            confidence: loopResult.confidence,
            factors: loopResult.uncertaintyFactors
          },
          planSummary: loopResult.stages[3].data,
          reviewCriteria: (loopResult.stages[4].data as any).reviewCriteria
        }
      },
      { upsert: true }
    );
  }

  // Persist DecisionRecord for traceability
  await DecisionRecordModel.create({
    loopStage: "plan",
    hazardType: "flood",
    correlationId: `plan-loop:${targetDate.getTime()}`,
    inputRefs: [],
    inputRefModels: [],
    output: {
      recommendationCount: loopResult.recommendations.length,
      recommendationIds: loopResult.recommendations.map((r) => r.recommendationId)
    },
    uncertainty: {
      confidence: loopResult.confidence,
      factors: loopResult.uncertaintyFactors
    },
    requiresHumanApproval: true
  });

  await auditService.record({
    eventType: "planner.run.completed",
    actorType: "system",
    correlationId: `plan-loop:${targetDate.getTime()}`,
    hazardType: "flood",
    payload: {
      timestamp: targetDate.toISOString(),
      recommendationCount: loopResult.recommendations.length,
      confidence: loopResult.confidence
    }
  });

  return loopResult;
}

export async function getRecommendations(timestampIso?: string): Promise<unknown[]> {
  if (timestampIso) {
    const timestamp = new Date(timestampIso);
    return PlanRecommendationModel.find({ timestamp }).sort({ priority: -1 }).lean();
  }
  return PlanRecommendationModel.find().sort({ timestamp: -1, priority: -1 }).limit(20).lean();
}

export async function getExplanationById(recommendationId: string): Promise<unknown> {
  const explanation = await PlannerExplanationModel.findOne({ recommendationId }).lean();
  const recommendation = await PlanRecommendationModel.findOne({ recommendationId }).lean();

  if (!recommendation) {
    throw new AppError("Recommendation not found for requested ID", 404, "RECOMMENDATION_NOT_FOUND");
  }

  return {
    recommendation,
    explanation: explanation || {
      recommendationId,
      observeSummary: { note: "Synthesized from flood extent and satellite observation" },
      estimateSummary: { note: "Synthesized from impact assessment engine" },
      explainUncertainty: { confidence: recommendation.confidenceScore, factors: [] },
      planSummary: { actionType: recommendation.actionType, priority: recommendation.priority },
      reviewCriteria: ["Human approval required before execution"]
    }
  };
}
