import { AppError } from "../errors/app-error.js";
import { MongoAuditService } from "../audit/audit.service.js";
import { GisFeatureModel } from "../models/gis-feature.model.js";
import { FloodPolygonModel } from "../models/flood-polygon.model.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { ImpactAssessmentModel } from "../models/impact-assessment.model.js";
import { AffectedFacilityModel } from "../models/affected-facility.model.js";
import { AffectedPopulationModel } from "../models/affected-population.model.js";
import { calculateImpactMetrics, isFeatureIntersectingFlood } from "./impact-calculator.js";
import * as turf from "@turf/turf";

const auditService = new MongoAuditService();

export async function runImpactAssessment(timestampIso: string): Promise<unknown> {
  const timestamp = new Date(timestampIso);

  const snapshot = await FloodSnapshotModel.findOne({ timestamp }).lean();
  if (!snapshot) {
    throw new AppError("Flood snapshot not found for requested timestamp", 404, "FLOOD_SNAPSHOT_NOT_FOUND");
  }

  const floodPolygons = await FloodPolygonModel.find({ snapshotId: snapshot._id }).lean();
  const floodGeoFeatures: GeoJSON.Feature[] = floodPolygons.map((p) => ({
    type: "Feature",
    geometry: p.geometry as GeoJSON.Geometry,
    properties: p.properties ?? {}
  }));

  // Query GIS features
  const gisFeatures = await GisFeatureModel.find().lean();

  let affectedPopulationCount = 0;
  let blockedRoadCount = 0;
  let blockedRoadLengthKm = 0;
  let affectedHospitalCount = 0;
  let affectedShelterCount = 0;
  let affectedSchoolCount = 0;

  const affectedFacilitiesToInsert: any[] = [];
  const districtMap = new Map<string, { totalPop: number; exposedPop: number; floodedAreaKm2: number }>();

  // Process GIS features against flood extent
  for (const feature of gisFeatures) {
    const isHit = isFeatureIntersectingFlood(feature.geometry as GeoJSON.Geometry, floodGeoFeatures);

    if (feature.layer === "district_boundary") {
      const distName = feature.name || "District";
      if (!districtMap.has(distName)) {
        districtMap.set(distName, { totalPop: 150_000, exposedPop: 0, floodedAreaKm2: 0 });
      }
      if (isHit) {
        const d = districtMap.get(distName)!;
        d.floodedAreaKm2 += snapshot.totalAreaKm2 / 4; // Distribution heuristic
        d.exposedPop += 12_500;
      }
    } else if (feature.layer === "population" && isHit) {
      const popVal = typeof feature.properties?.population === "number" ? feature.properties.population : 5_000;
      affectedPopulationCount += popVal;
    } else if (feature.layer === "road" && isHit) {
      blockedRoadCount += 1;
      const geom = feature.geometry as GeoJSON.Geometry;
      const lenKm = geom.type === "LineString" || geom.type === "MultiLineString" ? turf.length(turf.feature(geom)) : 1.2;
      blockedRoadLengthKm += Math.round(lenKm * 10) / 10;

      affectedFacilitiesToInsert.push({
        timestamp,
        facilityId: feature.externalId,
        facilityName: feature.name || `Road ${feature.externalId}`,
        facilityType: "road",
        geometry: feature.geometry,
        status: "partially_blocked",
        properties: feature.properties
      });
    } else if (feature.layer === "hospital" && isHit) {
      affectedHospitalCount += 1;
      affectedFacilitiesToInsert.push({
        timestamp,
        facilityId: feature.externalId,
        facilityName: feature.name,
        facilityType: "hospital",
        geometry: feature.geometry,
        status: "operational_risk",
        properties: feature.properties
      });
    } else if (feature.layer === "shelter" && isHit) {
      affectedShelterCount += 1;
      affectedFacilitiesToInsert.push({
        timestamp,
        facilityId: feature.externalId,
        facilityName: feature.name,
        facilityType: "shelter",
        geometry: feature.geometry,
        status: "flooded",
        properties: feature.properties
      });
    }
  }

  // Fallback defaults if population layer features were sparse
  if (affectedPopulationCount === 0 && floodGeoFeatures.length > 0) {
    affectedPopulationCount = Math.round(snapshot.totalAreaKm2 * 1_200);
  }

  const metrics = calculateImpactMetrics({
    affectedPopulation: affectedPopulationCount,
    blockedRoadLengthKm,
    affectedHospitalCount,
    affectedShelterCount,
    affectedSchoolCount
  });

  const districtBreakdown = Array.from(districtMap.entries()).map(([district, data]) => ({
    district,
    affectedPopulation: data.exposedPop > 0 ? data.exposedPop : Math.round(affectedPopulationCount / Math.max(1, districtMap.size)),
    floodedAreaKm2: Math.round(data.floodedAreaKm2 * 10) / 10
  }));

  const assessment = await ImpactAssessmentModel.findOneAndUpdate(
    { timestamp },
    {
      $set: {
        timestamp,
        snapshotId: snapshot._id,
        affectedPopulationCount,
        blockedRoadCount,
        blockedRoadLengthKm,
        affectedHospitalCount,
        affectedShelterCount,
        affectedSchoolCount,
        totalCriticalFacilities: metrics.totalCriticalFacilities,
        shelterDemandEstimate: metrics.shelterDemandEstimate,
        severityScore: metrics.severityScore,
        severityLevel: metrics.severityLevel,
        districtBreakdown
      }
    },
    { upsert: true, new: true }
  );

  // Clear & insert facility & population breakdown records
  await AffectedFacilityModel.deleteMany({ assessmentId: assessment._id });
  await AffectedPopulationModel.deleteMany({ assessmentId: assessment._id });

  if (affectedFacilitiesToInsert.length > 0) {
    const facilityDocs = affectedFacilitiesToInsert.map((fac) => ({
      ...fac,
      assessmentId: assessment._id
    }));
    await AffectedFacilityModel.insertMany(facilityDocs);
  }

  const popDocs = districtBreakdown.map((d) => ({
    assessmentId: assessment._id,
    timestamp,
    districtName: d.district,
    totalPopulation: 150_000,
    exposedPopulation: d.affectedPopulation,
    exposurePercentage: Math.round((d.affectedPopulation / 150_000) * 100 * 10) / 10,
    geometry: {
      type: "Polygon",
      coordinates: [[[76.0, 9.5], [76.5, 9.5], [76.5, 10.5], [76.0, 10.5], [76.0, 9.5]]]
    }
  }));

  if (popDocs.length > 0) {
    await AffectedPopulationModel.insertMany(popDocs);
  }

  await auditService.record({
    eventType: "impact.assessment.completed",
    actorType: "system",
    correlationId: `impact-assess:${String(assessment._id)}:${timestamp.toISOString()}`,
    hazardType: "flood",
    payload: {
      assessmentId: String(assessment._id),
      timestamp: timestamp.toISOString(),
      affectedPopulationCount,
      severityScore: metrics.severityScore,
      severityLevel: metrics.severityLevel,
      shelterDemandEstimate: metrics.shelterDemandEstimate
    }
  });

  return assessment.toObject();
}

export async function getImpactByTimestamp(timestampIso: string): Promise<unknown> {
  const timestamp = new Date(timestampIso);
  let assessment = await ImpactAssessmentModel.findOne({ timestamp }).lean();

  if (!assessment) {
    // Run auto assessment if snapshot exists
    const snapshot = await FloodSnapshotModel.findOne({ timestamp }).lean();
    if (snapshot) {
      assessment = (await runImpactAssessment(timestampIso)) as any;
    } else {
      throw new AppError("Impact assessment not found for timestamp", 404, "IMPACT_ASSESSMENT_NOT_FOUND");
    }
  }

  return assessment;
}

export async function getLatestImpactSummary(): Promise<unknown> {
  const latestSnapshot = await FloodSnapshotModel.findOne({ status: "processed" }).sort({ timestamp: -1 }).lean();
  if (!latestSnapshot) {
    return {
      assessment: null,
      message: "No flood snapshots available for impact assessment"
    };
  }

  return getImpactByTimestamp(latestSnapshot.timestamp.toISOString());
}

export async function getAffectedPopulation(timestampIso?: string): Promise<unknown[]> {
  if (timestampIso) {
    const timestamp = new Date(timestampIso);
    return AffectedPopulationModel.find({ timestamp }).lean();
  }
  return AffectedPopulationModel.find().sort({ timestamp: -1 }).limit(10).lean();
}

export async function getAffectedInfrastructure(timestampIso?: string): Promise<unknown[]> {
  if (timestampIso) {
    const timestamp = new Date(timestampIso);
    return AffectedFacilityModel.find({ timestamp }).lean();
  }
  return AffectedFacilityModel.find().sort({ timestamp: -1 }).limit(20).lean();
}
