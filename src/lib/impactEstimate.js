import * as turf from '@turf/turf';

/**
 * Perform spatial analysis of hazard extent against infrastructure layers using Turf.js
 */
export function calculateImpactEstimate({ floodPolygon, hospitals, shelters, roads }) {
  if (!floodPolygon || !floodPolygon.features || floodPolygon.features.length === 0) {
    return {
      floodedAreaHectares: 0,
      atRiskHospitals: [],
      atRiskShelters: [],
      safeShelters: [],
      affectedRoadsCount: 0,
      affectedRoadsKm: 0,
    };
  }

  // Combine flood polygons into a single feature/multi-polygon for analysis
  let combinedFlood = null;
  try {
    const validPolygons = floodPolygon.features.filter(
      f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    );
    if (validPolygons.length > 0) {
      combinedFlood = validPolygons.length === 1 
        ? validPolygons[0] 
        : turf.combine(turf.featureCollection(validPolygons)).features[0];
    }
  } catch (err) {
    console.warn('Could not combine flood polygons:', err);
    combinedFlood = floodPolygon.features[0];
  }

  // 1. Calculate total flooded area in hectares (1 sq km = 100 hectares)
  let floodedAreaHectares = 0;
  try {
    const areaSqMeters = turf.area(floodPolygon);
    floodedAreaHectares = Math.round(areaSqMeters / 10000);
  } catch (e) {
    console.error('Error calculating flood area:', e);
  }

  // Buffer flood polygon by 500m to capture nearby infrastructure at immediate risk
  let bufferedFlood = combinedFlood;
  try {
    if (combinedFlood) {
      bufferedFlood = turf.buffer(combinedFlood, 0.5, { units: 'kilometers' });
    }
  } catch (e) {
    console.warn('Buffer operation failed, using exact polygon', e);
  }

  // 2. Identify Hospitals at risk
  const atRiskHospitals = [];
  if (hospitals && hospitals.features) {
    hospitals.features.forEach(h => {
      if (!h.geometry) return;
      try {
        const pt = h.geometry.type === 'Point' 
          ? h 
          : turf.centroid(h);
        
        const isInside = bufferedFlood ? turf.booleanPointInPolygon(pt, bufferedFlood) : false;
        if (isInside) {
          atRiskHospitals.push({
            ...h,
            riskLevel: 'CRITICAL',
            name: h.properties?.name || h.properties?.['name:en'] || 'Unnamed Medical Facility'
          });
        }
      } catch (err) {
        // Ignore single point evaluation error
      }
    });
  }

  // 3. Identify Shelters at risk vs Safe Shelters
  const atRiskShelters = [];
  const safeShelters = [];

  if (shelters && shelters.features) {
    shelters.features.forEach(s => {
      if (!s.geometry) return;
      try {
        const pt = s.geometry.type === 'Point' 
          ? s 
          : turf.centroid(s);
        
        const isInside = bufferedFlood ? turf.booleanPointInPolygon(pt, bufferedFlood) : false;
        const shelterName = s.properties?.name || s.properties?.['addr:housename'] || 'Emergency Relief Centre';
        
        if (isInside) {
          atRiskShelters.push({
            ...s,
            riskLevel: 'HIGH',
            name: shelterName
          });
        } else {
          safeShelters.push({
            ...s,
            name: shelterName
          });
        }
      } catch (err) {
        // Fallback
      }
    });
  }

  // 4. Identify Affected Roads
  let affectedRoadsCount = 0;
  let affectedRoadsLengthMeters = 0;

  if (roads && roads.features && bufferedFlood) {
    roads.features.forEach(r => {
      if (!r.geometry || (r.geometry.type !== 'LineString' && r.geometry.type !== 'MultiLineString')) return;
      try {
        const intersects = turf.booleanIntersects(r, bufferedFlood);
        if (intersects) {
          affectedRoadsCount++;
          affectedRoadsLengthMeters += turf.length(r, { units: 'kilometers' });
        }
      } catch (err) {
        // Skip geometry error
      }
    });
  }

  return {
    floodedAreaHectares,
    atRiskHospitals,
    atRiskShelters,
    safeShelters,
    affectedRoadsCount,
    affectedRoadsKm: parseFloat(affectedRoadsLengthMeters.toFixed(1)),
  };
}
