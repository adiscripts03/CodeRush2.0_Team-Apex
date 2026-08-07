import { AppError } from "../errors/app-error.js";
import { MongoAuditService } from "../audit/audit.service.js";
import { FloodPolygonModel } from "../models/flood-polygon.model.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { DetectionResultModel } from "../models/detection-result.model.js";
import { processNdwiCells, type NdwiRasterCell } from "./ndwi.engine.js";
import { computeChangeDetection, type ChangeDetectionResult } from "./change-detection.engine.js";
import crypto from "node:crypto";

const auditService = new MongoAuditService();

export interface DetectFloodInput {
  timestamp: string;
  sourceImageId: string;
  cells: NdwiRasterCell[];
  threshold?: number;
  cloudCoverFraction?: number;
}

export async function getCurrentFlood(): Promise<{
  snapshot: unknown;
  features: GeoJSON.FeatureCollection;
}> {
  const snapshot = await FloodSnapshotModel.findOne({ status: "processed" }).sort({ timestamp: -1 }).lean();

  if (!snapshot) {
    return {
      snapshot: null,
      features: { type: "FeatureCollection", features: [] }
    };
  }

  const polygons = await FloodPolygonModel.find({ snapshotId: snapshot._id }).lean();

  const features: GeoJSON.Feature[] = polygons.map((p) => ({
    type: "Feature",
    id: String(p._id),
    geometry: p.geometry as GeoJSON.Geometry,
    properties: (p.properties as GeoJSON.GeoJsonProperties) ?? {}
  }));

  return {
    snapshot,
    features: {
      type: "FeatureCollection",
      features
    }
  };
}

export async function getFloodHistory(): Promise<unknown[]> {
  return FloodSnapshotModel.find().sort({ timestamp: -1 }).lean();
}

export async function runFloodDetection(input: DetectFloodInput): Promise<unknown> {
  const timestamp = new Date(input.timestamp);
  const threshold = input.threshold ?? 0.3;

  const detectionOutput = processNdwiCells(input.cells, {
    threshold,
    cloudCoverFraction: input.cloudCoverFraction
  });

  const snapshot = await FloodSnapshotModel.findOneAndUpdate(
    { timestamp },
    {
      $set: {
        timestamp,
        sourceImageId: input.sourceImageId,
        totalAreaKm2: detectionOutput.totalAreaKm2,
        polygonCount: detectionOutput.polygonCount,
        confidenceScore: detectionOutput.overallConfidence,
        status: "processed"
      }
    },
    { upsert: true, new: true }
  );

  // Clear existing polygons for this snapshot if re-running
  await FloodPolygonModel.deleteMany({ snapshotId: snapshot._id });

  const polygonDocs = detectionOutput.features.map((f) => ({
    snapshotId: snapshot._id,
    timestamp,
    geometry: f.geometry,
    properties: {
      areaKm2: f.areaKm2,
      confidence: f.confidence,
      meanNdwi: f.meanNdwi,
      sensorType: "Sentinel-2"
    },
    checksum: crypto
      .createHash("sha256")
      .update(JSON.stringify(f.geometry))
      .digest("hex")
  }));

  if (polygonDocs.length > 0) {
    await FloodPolygonModel.insertMany(polygonDocs);
  }

  const detectionResult = await DetectionResultModel.create({
    timestamp,
    algorithm: "NDWI_SENTINEL_2",
    parameters: {
      threshold,
      bandGreen: "B03",
      bandNir: "B08"
    },
    confidenceScore: detectionOutput.overallConfidence,
    processedAt: new Date(),
    metadata: {
      sourceImageId: input.sourceImageId,
      polygonCount: detectionOutput.polygonCount,
      totalAreaKm2: detectionOutput.totalAreaKm2
    }
  });

  await auditService.record({
    eventType: "flood.detection.completed",
    actorType: "system",
    correlationId: `flood-detect:${String(snapshot._id)}:${timestamp.toISOString()}`,
    hazardType: "flood",
    payload: {
      snapshotId: String(snapshot._id),
      timestamp: timestamp.toISOString(),
      polygonCount: detectionOutput.polygonCount,
      totalAreaKm2: detectionOutput.totalAreaKm2,
      confidenceScore: detectionOutput.overallConfidence
    }
  });

  return detectionResult.toObject();
}

export async function getFloodChange(timestampIso: string): Promise<ChangeDetectionResult> {
  const targetDate = new Date(timestampIso);

  const targetSnapshot = await FloodSnapshotModel.findOne({ timestamp: targetDate }).lean();
  if (!targetSnapshot) {
    throw new AppError("Flood snapshot not found for requested timestamp", 404, "FLOOD_SNAPSHOT_NOT_FOUND");
  }

  const prevSnapshot = await FloodSnapshotModel.findOne({ timestamp: { $lt: targetDate } })
    .sort({ timestamp: -1 })
    .lean();

  const targetPolygons = await FloodPolygonModel.find({ snapshotId: targetSnapshot._id }).lean();
  const targetFeatures: GeoJSON.Feature[] = targetPolygons.map((p) => ({
    type: "Feature",
    geometry: p.geometry as GeoJSON.Geometry,
    properties: (p.properties as GeoJSON.GeoJsonProperties) ?? {}
  }));

  if (!prevSnapshot) {
    // No previous snapshot — entire target extent is classified as expanded
    return computeChangeDetection([], targetFeatures, targetDate, targetDate);
  }

  const prevPolygons = await FloodPolygonModel.find({ snapshotId: prevSnapshot._id }).lean();
  const prevFeatures: GeoJSON.Feature[] = prevPolygons.map((p) => ({
    type: "Feature",
    geometry: p.geometry as GeoJSON.Geometry,
    properties: (p.properties as GeoJSON.GeoJsonProperties) ?? {}
  }));

  return computeChangeDetection(prevFeatures, targetFeatures, prevSnapshot.timestamp, targetDate);
}
