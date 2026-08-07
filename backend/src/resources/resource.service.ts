import { AppError } from "../errors/app-error.js";
import { MongoAuditService } from "../audit/audit.service.js";
import { ResourceModel } from "../models/resource.model.js";
import { VehicleModel } from "../models/vehicle.model.js";
import { ShelterCapacityModel } from "../models/shelter-capacity.model.js";
import { RoutePlanModel } from "../models/route-plan.model.js";
import { FloodPolygonModel } from "../models/flood-polygon.model.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { computeSafeRoute, type RouteCalculationResult } from "../routing/routing-engine.js";
import { allocateShelterCapacity, findNearestAvailableShelter } from "./resource-manager.js";

const auditService = new MongoAuditService();

export interface ResourceUpdateInput {
  resourceId?: string;
  vehicleId?: string;
  shelterId?: string;
  quantity?: number;
  status?: string;
  occupancy?: number;
}

export async function getAllResources(): Promise<{
  resources: unknown[];
  vehicles: unknown[];
  shelters: unknown[];
}> {
  const [resources, vehicles, shelters] = await Promise.all([
    ResourceModel.find().lean(),
    VehicleModel.find().lean(),
    ShelterCapacityModel.find().lean()
  ]);

  return { resources, vehicles, shelters };
}

export async function updateResourceStatus(input: ResourceUpdateInput): Promise<unknown> {
  let updatedDoc: unknown = null;

  if (input.resourceId) {
    updatedDoc = await ResourceModel.findByIdAndUpdate(
      input.resourceId,
      { $set: { quantity: input.quantity, status: input.status } },
      { new: true }
    ).lean();
  } else if (input.vehicleId) {
    updatedDoc = await VehicleModel.findOneAndUpdate(
      { vehicleId: input.vehicleId },
      { $set: { status: input.status } },
      { new: true }
    ).lean();
  } else if (input.shelterId) {
    const shelter = await ShelterCapacityModel.findOne({ shelterId: input.shelterId });
    if (shelter) {
      if (typeof input.occupancy === "number") {
        const alloc = allocateShelterCapacity(
          {
            shelterId: shelter.shelterId,
            name: shelter.name,
            maxCapacity: shelter.maxCapacity,
            currentOccupancy: shelter.currentOccupancy,
            location: (shelter.location as any).coordinates as [number, number],
            status: shelter.status as any
          },
          input.occupancy - shelter.currentOccupancy
        );
        shelter.currentOccupancy = alloc.updatedOccupancy;
        shelter.availableCapacity = alloc.updatedAvailableCapacity;
        shelter.status = alloc.newStatus as any;
      }
      if (input.status) {
        shelter.status = input.status as any;
      }
      await shelter.save();
      updatedDoc = shelter.toObject();
    }
  }

  if (!updatedDoc) {
    throw new AppError("Resource or shelter not found for update", 404, "RESOURCE_NOT_FOUND");
  }

  await auditService.record({
    eventType: "resource.updated",
    actorType: "system",
    correlationId: `res-update:${Date.now()}`,
    hazardType: "flood",
    payload: { input, updatedDoc }
  });

  return updatedDoc;
}

export async function generateSafeRoute(
  origin: { name: string; coordinates: [number, number] },
  destination: { name: string; coordinates: [number, number] }
): Promise<RouteCalculationResult> {
  const latestSnapshot = await FloodSnapshotModel.findOne({ status: "processed" }).sort({ timestamp: -1 }).lean();
  let floodFeatures: GeoJSON.Feature[] = [];

  if (latestSnapshot) {
    const polygons = await FloodPolygonModel.find({ snapshotId: latestSnapshot._id }).lean();
    floodFeatures = polygons.map((p) => ({
      type: "Feature",
      geometry: p.geometry as GeoJSON.Geometry,
      properties: p.properties ?? {}
    }));
  }

  const routeResult = computeSafeRoute({
    origin,
    destination,
    floodPolygons: floodFeatures
  });

  await RoutePlanModel.create({
    origin: routeResult.origin,
    destination: routeResult.destination,
    path: routeResult.path.geometry,
    totalDistanceKm: routeResult.totalDistanceKm,
    estimatedTimeMinutes: routeResult.estimatedTimeMinutes,
    safetyStatus: routeResult.safetyStatus,
    avoidedFloodAreaKm2: routeResult.avoidedFloodAreaKm2
  });

  await auditService.record({
    eventType: "route.generated",
    actorType: "system",
    correlationId: `route-gen:${Date.now()}`,
    hazardType: "flood",
    payload: {
      origin: routeResult.origin.name,
      destination: routeResult.destination.name,
      distanceKm: routeResult.totalDistanceKm,
      safetyStatus: routeResult.safetyStatus
    }
  });

  return routeResult;
}

export async function generateEvacuationRoute(
  originCoords: [number, number],
  originName = "Evacuation Point",
  evacueesCount = 50
): Promise<RouteCalculationResult> {
  const shelters = await ShelterCapacityModel.find().lean();
  const shelterInputs = shelters.map((s) => ({
    shelterId: s.shelterId,
    name: s.name,
    maxCapacity: s.maxCapacity,
    currentOccupancy: s.currentOccupancy,
    location: (s.location as any).coordinates as [number, number],
    status: s.status as any
  }));

  const nearestShelter = findNearestAvailableShelter(originCoords, shelterInputs);

  if (!nearestShelter) {
    throw new AppError("No available shelter with capacity found", 404, "SHELTER_UNAVAILABLE");
  }

  // Allocate shelter capacity
  const shelterDoc = await ShelterCapacityModel.findOne({ shelterId: nearestShelter.shelterId });
  if (shelterDoc) {
    const alloc = allocateShelterCapacity(nearestShelter, evacueesCount);
    shelterDoc.currentOccupancy = alloc.updatedOccupancy;
    shelterDoc.availableCapacity = alloc.updatedAvailableCapacity;
    shelterDoc.status = alloc.newStatus as any;
    await shelterDoc.save();
  }

  const route = await generateSafeRoute(
    { name: originName, coordinates: originCoords },
    { name: nearestShelter.name, coordinates: nearestShelter.location }
  );

  route.assignedShelterId = nearestShelter.shelterId;
  return route;
}
