import * as turf from "@turf/turf";

export interface NdwiRasterCell {
  lng: number;
  lat: number;
  green: number; // Sentinel-2 Band 3 (B03) reflectance
  nir: number;   // Sentinel-2 Band 8 (B08) reflectance
}

export interface DetectionOptions {
  threshold?: number;
  cloudCoverFraction?: number; // 0 to 1
  minCellAreaKm2?: number;
}

export interface DetectedFloodFeature {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaKm2: number;
  meanNdwi: number;
  confidence: number;
}

export interface NdwiDetectionOutput {
  features: DetectedFloodFeature[];
  totalAreaKm2: number;
  overallConfidence: number;
  polygonCount: number;
}

export function computeNdwi(green: number, nir: number): number {
  const denominator = green + nir;
  if (denominator === 0) {
    return 0;
  }
  const ndwi = (green - nir) / denominator;
  return Math.max(-1, Math.min(1, ndwi));
}

export function validatePolygon(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): boolean {
  if (!geometry || !geometry.coordinates || !Array.isArray(geometry.coordinates)) {
    return false;
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.length >= 4 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
    );
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.every((poly) =>
      poly.every(
        (ring) =>
          Array.isArray(ring) &&
          ring.length >= 4 &&
          ring[0][0] === ring[ring.length - 1][0] &&
          ring[0][1] === ring[ring.length - 1][1]
      )
    );
  }

  return false;
}

export function calculateConfidence(
  meanNdwi: number,
  threshold: number,
  cloudCoverFraction = 0.05
): number {
  // NDWI margin above threshold gives higher confidence
  const margin = Math.max(0, meanNdwi - threshold);
  const ndwiConfidence = Math.min(1, 0.6 + margin * 0.8);
  const cloudPenalty = Math.min(0.4, cloudCoverFraction * 0.5);
  const rawScore = ndwiConfidence - cloudPenalty;
  return Math.round(Math.max(0.1, Math.min(1.0, rawScore)) * 100) / 100;
}

/**
 * Converts water-detected raster grid cells into simplified GeoJSON Polygons.
 */
export function processNdwiCells(
  cells: NdwiRasterCell[],
  options: DetectionOptions = {}
): NdwiDetectionOutput {
  const threshold = options.threshold ?? 0.3;
  const cloudCoverFraction = options.cloudCoverFraction ?? 0.05;

  const waterCells = cells
    .map((c) => ({ ...c, ndwi: computeNdwi(c.green, c.nir) }))
    .filter((c) => c.ndwi >= threshold);

  if (waterCells.length === 0) {
    return {
      features: [],
      totalAreaKm2: 0,
      overallConfidence: 0.9,
      polygonCount: 0
    };
  }

  // Group nearby cells into bounding polygon boxes (0.01 deg grid cells ~1.1km)
  const cellRadiusDeg = 0.008;
  const polygons: DetectedFloodFeature[] = waterCells.map((cell) => {
    const minLng = cell.lng - cellRadiusDeg;
    const maxLng = cell.lng + cellRadiusDeg;
    const minLat = cell.lat - cellRadiusDeg;
    const maxLat = cell.lat + cellRadiusDeg;

    const ring: number[][] = [
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat]
    ];

    const polyGeometry: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [ring]
    };

    const turfPoly = turf.polygon(polyGeometry.coordinates);
    const areaM2 = turf.area(turfPoly);
    const areaKm2 = Math.round((areaM2 / 1_000_000) * 1000) / 1000;
    const confidence = calculateConfidence(cell.ndwi, threshold, cloudCoverFraction);

    return {
      geometry: polyGeometry,
      areaKm2: Math.max(0.01, areaKm2),
      meanNdwi: Math.round(cell.ndwi * 100) / 100,
      confidence
    };
  });

  const validPolygons = polygons.filter((p) => validatePolygon(p.geometry));
  const totalAreaKm2 = Math.round(validPolygons.reduce((acc, p) => acc + p.areaKm2, 0) * 100) / 100;
  const avgConfidence =
    validPolygons.length > 0
      ? Math.round(
          (validPolygons.reduce((acc, p) => acc + p.confidence, 0) / validPolygons.length) * 100
        ) / 100
      : 0;

  return {
    features: validPolygons,
    totalAreaKm2,
    overallConfidence: avgConfidence,
    polygonCount: validPolygons.length
  };
}
