import * as turf from "@turf/turf";

export type RouteSafetyStatus = "safe" | "blocked" | "caution";

export interface CalculateRouteInput {
  origin: { name: string; coordinates: [number, number] };
  destination: { name: string; coordinates: [number, number] };
  floodPolygons?: GeoJSON.Feature[];
  assignedShelterId?: string;
}

export interface RouteCalculationResult {
  origin: { name: string; coordinates: [number, number] };
  destination: { name: string; coordinates: [number, number] };
  path: GeoJSON.Feature<GeoJSON.LineString>;
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  safetyStatus: RouteSafetyStatus;
  avoidedFloodAreaKm2: number;
  assignedShelterId?: string;
}

export function computeSafeRoute(input: CalculateRouteInput): RouteCalculationResult {
  const { origin, destination, floodPolygons = [], assignedShelterId } = input;

  const origPt = turf.point(origin.coordinates);
  const destPt = turf.point(destination.coordinates);
  const directLine = turf.lineString([origin.coordinates, destination.coordinates]);

  let intersectsFlood = false;
  let intersectingPolygon: GeoJSON.Feature | null = null;

  for (const floodPoly of floodPolygons) {
    try {
      if (turf.booleanIntersects(directLine as any, floodPoly as any)) {
        intersectsFlood = true;
        intersectingPolygon = floodPoly;
        break;
      }
    } catch {
      // Fallback
    }
  }

  const routeCoords: [number, number][] = [origin.coordinates];
  let safetyStatus: RouteSafetyStatus = "safe";
  let avoidedAreaKm2 = 0;

  if (!intersectsFlood) {
    routeCoords.push(destination.coordinates);
  } else if (intersectingPolygon) {
    // Interpolate detour waypoints around polygon bbox
    const bbox = turf.bbox(intersectingPolygon);
    const [minLng, minLat, maxLng, maxLat] = bbox;
    avoidedAreaKm2 = Math.round(turf.area(intersectingPolygon) / 1_000_000 * 10) / 10;

    // Check if origin or destination is trapped inside flood
    const origInside = turf.booleanPointInPolygon(origPt, intersectingPolygon as any);
    const destInside = turf.booleanPointInPolygon(destPt, intersectingPolygon as any);

    if (origInside && destInside) {
      safetyStatus = "blocked";
      routeCoords.push(destination.coordinates);
    } else {
      safetyStatus = "caution";
      // Construct waypoint detour (North bypass or South bypass depending on latitude)
      const detourLat = origin.coordinates[1] > (minLat + maxLat) / 2 ? maxLat + 0.02 : minLat - 0.02;
      const detourLng = (origin.coordinates[0] + destination.coordinates[0]) / 2;

      routeCoords.push([detourLng, detourLat]);
      routeCoords.push(destination.coordinates);
    }
  } else {
    safetyStatus = "caution";
    routeCoords.push(destination.coordinates);
  }

  const pathFeature = turf.lineString(routeCoords);
  const distanceKm = Math.round(turf.length(pathFeature, { units: "kilometers" }) * 100) / 100;
  // Speed heuristic: 35 km/h for emergency vehicle detour
  const estimatedTimeMinutes = Math.round((distanceKm / 35) * 60);

  return {
    origin,
    destination,
    path: pathFeature,
    totalDistanceKm: distanceKm,
    estimatedTimeMinutes: Math.max(1, estimatedTimeMinutes),
    safetyStatus,
    avoidedFloodAreaKm2: avoidedAreaKm2,
    assignedShelterId
  };
}
