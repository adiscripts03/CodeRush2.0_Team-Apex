import crypto from "node:crypto";

export interface PlannerInputData {
  timestamp: Date;
  floodAreaKm2: number;
  confidenceScore: number;
  affectedPopulation: number;
  blockedRoadCount: number;
  blockedRoadLengthKm: number;
  affectedHospitalCount: number;
  shelterDemand: number;
  openShelterCapacity: number;
  availableBoats: number;
  districtName?: string;
  shelters?: Array<{ shelterId: string; name: string; status: string; availableCapacity: number }>;
  blockedRoads?: Array<{ facilityId: string; facilityName: string }>;
}

export interface RecommendationDraft {
  recommendationId: string;
  timestamp: Date;
  actionType: "open_shelter" | "deploy_rescue_boats" | "close_road" | "send_medical_team" | "prioritize_district" | "schedule_review";
  targetName: string;
  targetId?: string;
  priority: "low" | "medium" | "high" | "critical";
  reasoning: string[];
  evidence: Array<{ metric: string; value: unknown; source: string }>;
  confidenceScore: number;
  constraints: string[];
  alternatives: Array<{ action: string; tradeOff: string }>;
  status: "proposed";
}

export function generateRecommendations(data: PlannerInputData): RecommendationDraft[] {
  const recommendations: RecommendationDraft[] = [];
  const seenTargets = new Set<string>();

  const addRecommendation = (rec: RecommendationDraft) => {
    const key = `${rec.actionType}:${rec.targetId || rec.targetName}`;
    if (!seenTargets.has(key)) {
      seenTargets.add(key);
      recommendations.push(rec);
    }
  };

  // 1. Open Shelters if demand > open capacity
  if (data.shelterDemand > data.openShelterCapacity) {
    const deficit = data.shelterDemand - data.openShelterCapacity;
    const targetShelter = data.shelters?.find((s) => s.status !== "full" && s.status !== "flooded") || {
      shelterId: "SHELTER_KALOOR_STADIUM",
      name: "Kaloor Stadium Emergency Relief Camp"
    };

    addRecommendation({
      recommendationId: `REC_SHELTER_${data.timestamp.getTime()}`,
      timestamp: data.timestamp,
      actionType: "open_shelter",
      targetName: targetShelter.name,
      targetId: targetShelter.shelterId,
      priority: deficit > 5000 ? "critical" : "high",
      reasoning: [
        `Shelter demand (${data.shelterDemand.toLocaleString()}) exceeds open capacity (${data.openShelterCapacity.toLocaleString()}) by ${deficit.toLocaleString()} persons.`,
        `Opening ${targetShelter.name} provides immediate safe capacity.`
      ],
      evidence: [
        { metric: "Shelter Demand", value: data.shelterDemand, source: "Impact Assessment Engine" },
        { metric: "Available Open Capacity", value: data.openShelterCapacity, source: "Resource Inventory Engine" }
      ],
      confidenceScore: Math.round(data.confidenceScore * 0.95 * 100) / 100,
      constraints: ["Requires 500 food ration packs", "Sanitation team deployment needed"],
      alternatives: [{ action: "Inter-district transfer to Thrissur", tradeOff: "Longer travel time (2.5 hours)" }],
      status: "proposed"
    });
  }

  // 2. Deploy Rescue Boats if population in flooded zone is high
  if (data.floodAreaKm2 > 10.0 && data.availableBoats > 0) {
    const boatsToDeploy = Math.min(data.availableBoats, Math.ceil(data.floodAreaKm2 / 5));
    addRecommendation({
      recommendationId: `REC_BOATS_${data.timestamp.getTime()}`,
      timestamp: data.timestamp,
      actionType: "deploy_rescue_boats",
      targetName: "NDRF Motorised Inflatable Boat Squad",
      targetId: "BOAT_NDRF_01",
      priority: "critical",
      reasoning: [
        `Flooded surface area reached ${data.floodAreaKm2.toFixed(1)} km².`,
        `Deploying ${boatsToDeploy} rescue boats ensures water evacuation for trapped populations.`
      ],
      evidence: [
        { metric: "Flooded Area", value: `${data.floodAreaKm2} km²`, source: "NDWI Flood Engine" },
        { metric: "Available Rescue Boats", value: data.availableBoats, source: "Resource Inventory Engine" }
      ],
      confidenceScore: 0.90,
      constraints: [`Maximum fleet available: ${data.availableBoats} boats`, "Requires trained NDRF pilots"],
      alternatives: [{ action: "Air drop supplies via helicopter", tradeOff: "Cannot evacuate elderly or injured persons" }],
      status: "proposed"
    });
  }

  // 3. Close Roads intersecting flood polygons
  if (data.blockedRoadCount > 0) {
    const targetRoad = data.blockedRoads?.[0] || { facilityId: "ROAD_NH66_ALUVA", facilityName: "NH-66 Aluva-Ernakulam Stretch" };
    addRecommendation({
      recommendationId: `REC_ROAD_${data.timestamp.getTime()}`,
      timestamp: data.timestamp,
      actionType: "close_road",
      targetName: targetRoad.facilityName,
      targetId: targetRoad.facilityId,
      priority: "high",
      reasoning: [
        `${data.blockedRoadCount} road segments spanning ${data.blockedRoadLengthKm.toFixed(1)} km intersect active flood extent.`,
        `Closing ${targetRoad.facilityName} prevents vehicle submergence and accidents.`
      ],
      evidence: [
        { metric: "Blocked Road Count", value: data.blockedRoadCount, source: "Impact Assessment Engine" },
        { metric: "Blocked Length", value: `${data.blockedRoadLengthKm} km`, source: "GIS Infrastructure Layer" }
      ],
      confidenceScore: 0.95,
      constraints: ["Police traffic barrier setup required", "Reroute civilian traffic to SH-1 bypass"],
      alternatives: [{ action: "Issue warning signs without closure", tradeOff: "High risk of vehicle submergence" }],
      status: "proposed"
    });
  }

  // 4. Send Medical Teams if hospitals face operational risk
  if (data.affectedHospitalCount > 0) {
    addRecommendation({
      recommendationId: `REC_MEDICAL_${data.timestamp.getTime()}`,
      timestamp: data.timestamp,
      actionType: "send_medical_team",
      targetName: "Aluva District Hospital Medical Response Team",
      targetId: "MED_ALUVA_01",
      priority: "high",
      reasoning: [
        `${data.affectedHospitalCount} medical facility is flooded or at operational risk.`,
        `Dispatching emergency medical unit ensures critical patient care continuity.`
      ],
      evidence: [
        { metric: "Affected Hospitals", value: data.affectedHospitalCount, source: "Impact Assessment Engine" }
      ],
      confidenceScore: 0.88,
      constraints: ["Requires mobile generator & trauma kits"],
      alternatives: [{ action: "Evacuate hospital patients to General Hospital Ernakulam", tradeOff: "High risk for ICU patients" }],
      status: "proposed"
    });
  }

  // 5. Prioritize District based on severity
  const districtName = data.districtName || "Ernakulam";
  addRecommendation({
    recommendationId: `REC_DISTRICT_${data.timestamp.getTime()}`,
    timestamp: data.timestamp,
    actionType: "prioritize_district",
    targetName: districtName,
    targetId: `DISTRICT_${districtName.toUpperCase()}`,
    priority: "high",
    reasoning: [
      `District ${districtName} accounts for largest proportion of affected population (${data.affectedPopulation.toLocaleString()}).`,
      `Prioritizing resource allocation to ${districtName} maximizes lives saved.`
    ],
    evidence: [
      { metric: "District Affected Population", value: data.affectedPopulation, source: "Impact Assessment Engine" }
    ],
    confidenceScore: 0.92,
    constraints: ["Limited logistics personnel"],
    alternatives: [{ action: "Distribute resources equally across all 14 districts", tradeOff: "Under-resources high-impact flood epicenter" }],
    status: "proposed"
  });

  // 6. Schedule Next Review
  addRecommendation({
    recommendationId: `REC_REVIEW_${data.timestamp.getTime()}`,
    timestamp: data.timestamp,
    actionType: "schedule_review",
    targetName: "EOC Executive Review (6-Hour Timestep)",
    targetId: "REVIEW_6H",
    priority: "medium",
    reasoning: [
      "Dynamic flood evolution requires regular periodic decision loop execution.",
      "Next review scheduled in 6 hours upon arrival of next Sentinel-2 snapshot."
    ],
    evidence: [
      { metric: "Timestep Interval", value: "6 hours", source: "Historical Replay Timeline" }
    ],
    confidenceScore: 1.0,
    constraints: ["Subject to satellite pass availability"],
    alternatives: [{ action: "Continuous 1-hour review", tradeOff: "Redundant when no new satellite data has arrived" }],
    status: "proposed"
  });

  return recommendations;
}
