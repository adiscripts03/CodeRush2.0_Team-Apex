import * as turf from "@turf/turf";

export interface ChangeDetectionResult {
  timestampFrom: Date;
  timestampTo: Date;
  timeDeltaHours: number;
  areaFromKm2: number;
  areaToKm2: number;
  netChangeKm2: number;
  expandedAreaKm2: number;
  recededAreaKm2: number;
  persistedAreaKm2: number;
  expansionRateKm2PerHour: number;
  expandedFeatures: GeoJSON.FeatureCollection;
  recededFeatures: GeoJSON.FeatureCollection;
  persistedFeatures: GeoJSON.FeatureCollection;
}

export function validateTimestampOrder(t1: Date, t2: Date): void {
  if (t2.getTime() < t1.getTime()) {
    throw new Error("Target timestamp must be equal to or later than baseline timestamp");
  }
}

export function computeChangeDetection(
  featuresFrom: GeoJSON.Feature[],
  featuresTo: GeoJSON.Feature[],
  timestampFrom: Date,
  timestampTo: Date
): ChangeDetectionResult {
  validateTimestampOrder(timestampFrom, timestampTo);

  const timeDeltaMs = timestampTo.getTime() - timestampFrom.getTime();
  const timeDeltaHours = timeDeltaMs > 0 ? timeDeltaMs / (1000 * 60 * 60) : 0;

  const areaFrom = featuresFrom.reduce((acc, f) => acc + turf.area(f), 0) / 1_000_000;
  const areaTo = featuresTo.reduce((acc, f) => acc + turf.area(f), 0) / 1_000_000;

  const expandedFeatures: GeoJSON.Feature[] = [];
  const recededFeatures: GeoJSON.Feature[] = [];
  const persistedFeatures: GeoJSON.Feature[] = [];

  // Combine features from each timestamp into single multi-polygons if non-empty
  const polyFrom = featuresFrom.length > 0 ? combineFeaturesToPolygon(featuresFrom) : null;
  const polyTo = featuresTo.length > 0 ? combineFeaturesToPolygon(featuresTo) : null;

  if (!polyFrom && polyTo) {
    // Everything in To is expanded
    expandedFeatures.push(polyTo);
  } else if (polyFrom && !polyTo) {
    // Everything in From is receded
    recededFeatures.push(polyFrom);
  } else if (polyFrom && polyTo) {
    // Calculate expansion: polyTo - polyFrom
    try {
      const diffToFrom = turf.difference(turf.featureCollection([polyTo, polyFrom]));
      if (diffToFrom) {
        expandedFeatures.push(diffToFrom);
      }
    } catch {
      expandedFeatures.push(polyTo);
    }

    // Calculate recession: polyFrom - polyTo
    try {
      const diffFromTo = turf.difference(turf.featureCollection([polyFrom, polyTo]));
      if (diffFromTo) {
        recededFeatures.push(diffFromTo);
      }
    } catch {
      recededFeatures.push(polyFrom);
    }

    // Calculate persistence: polyFrom INTERSECT polyTo
    try {
      const intersect = turf.intersect(turf.featureCollection([polyFrom, polyTo]));
      if (intersect) {
        persistedFeatures.push(intersect);
      }
    } catch {
      // Fallback
    }
  }

  const expandedAreaKm2 = Math.round(expandedFeatures.reduce((acc, f) => acc + turf.area(f), 0) / 1000) / 1000;
  const recededAreaKm2 = Math.round(recededFeatures.reduce((acc, f) => acc + turf.area(f), 0) / 1000) / 1000;
  const persistedAreaKm2 = Math.round(persistedFeatures.reduce((acc, f) => acc + turf.area(f), 0) / 1000) / 1000;

  const netChangeKm2 = Math.round((areaTo - areaFrom) * 100) / 100;
  const expansionRate =
    timeDeltaHours > 0 ? Math.round((expandedAreaKm2 / timeDeltaHours) * 100) / 100 : expandedAreaKm2;

  return {
    timestampFrom,
    timestampTo,
    timeDeltaHours: Math.round(timeDeltaHours * 10) / 10,
    areaFromKm2: Math.round(areaFrom * 100) / 100,
    areaToKm2: Math.round(areaTo * 100) / 100,
    netChangeKm2,
    expandedAreaKm2,
    recededAreaKm2,
    persistedAreaKm2,
    expansionRateKm2PerHour: expansionRate,
    expandedFeatures: turf.featureCollection(expandedFeatures),
    recededFeatures: turf.featureCollection(recededFeatures),
    persistedFeatures: turf.featureCollection(persistedFeatures)
  };
}

function combineFeaturesToPolygon(features: GeoJSON.Feature[]): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  if (features.length === 1) {
    return features[0] as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  }

  try {
    let merged = features[0];
    for (let i = 1; i < features.length; i++) {
      const unionResult = turf.union(turf.featureCollection([merged as any, features[i] as any]));
      if (unionResult) {
        merged = unionResult;
      }
    }
    return merged as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  } catch {
    return features[0] as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  }
}
