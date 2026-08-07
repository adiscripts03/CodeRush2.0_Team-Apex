import * as turf from '@turf/turf';

/**
 * Generates rule-based evacuation response recommendations.
 * Each recommendation is strictly a "pending recommendation" until human approval.
 */
export function generateEvacuationPlan({ atRiskHospitals, atRiskShelters, safeShelters, shelterCapacities }) {
  const recommendations = [];

  const getCapacityInfo = (shelterFeature) => {
    const osmId = shelterFeature.properties?.['@id'] || shelterFeature.id;
    const overrides = shelterCapacities?.overrides?.[osmId];
    if (overrides) {
      return overrides;
    }
    const amenity = shelterFeature.properties?.amenity || 'school';
    const fallback = shelterCapacities?.defaults?.[amenity] || { capacity_total: 200, capacity_available: 150 };
    return fallback;
  };

  // Track remaining shelter capacity in local simulation
  const shelterCapacityTracker = new Map();
  safeShelters.forEach(s => {
    const key = s.properties?.['@id'] || s.id || s.name;
    const cap = getCapacityInfo(s);
    shelterCapacityTracker.set(key, { ...cap, feature: s });
  });

  // Helper to find nearest safe shelter with remaining capacity
  const findNearestAvailableShelter = (sourcePt) => {
    let nearest = null;
    let minDistance = Infinity;

    shelterCapacityTracker.forEach((capData, shelterKey) => {
      if (capData.capacity_available <= 0) return;

      const shelterPt = capData.feature.geometry.type === 'Point' 
        ? capData.feature 
        : turf.centroid(capData.feature);

      try {
        const dist = turf.distance(sourcePt, shelterPt, { units: 'kilometers' });
        if (dist < minDistance) {
          minDistance = dist;
          nearest = {
            shelterKey,
            shelterFeature: capData.feature,
            distanceKm: parseFloat(dist.toFixed(2)),
            capacityData: capData,
            shelterPt,
          };
        }
      } catch (err) {
        // Skip invalid distance
      }
    });

    return nearest;
  };

  // 1. Priority 1 Actions: Evacuate Critical At-Risk Hospitals
  atRiskHospitals.forEach((hospital, idx) => {
    const hospPt = hospital.geometry.type === 'Point' ? hospital : turf.centroid(hospital);
    const nearestShelter = findNearestAvailableShelter(hospPt);

    const hospName = hospital.properties?.name || hospital.properties?.['name:en'] || `Hospital Zone #${idx + 1}`;
    const evacCount = Math.floor(Math.random() * 40) + 30; // 30-70 patients/staff

    if (nearestShelter) {
      // Deduct capacity
      const trackerObj = shelterCapacityTracker.get(nearestShelter.shelterKey);
      if (trackerObj) {
        trackerObj.capacity_available = Math.max(0, trackerObj.capacity_available - evacCount);
      }

      const sourceCoords = hospPt.geometry.coordinates;
      const targetCoords = nearestShelter.shelterPt.geometry.coordinates;

      recommendations.push({
        id: `plan-hosp-${idx + 1}-${Date.now()}`,
        priority: 'P1 - CRITICAL',
        type: 'Medical Evacuation',
        title: `Evacuate ${hospName}`,
        description: `Transfer ${evacCount} high-risk patients and medical personnel from ${hospName} to designated safe hub ${nearestShelter.shelterFeature.name}.`,
        sourceLocation: hospName,
        targetShelterName: nearestShelter.shelterFeature.name,
        estimatedPatients: evacCount,
        distanceKm: nearestShelter.distanceKm,
        allocatedCapacity: trackerObj ? trackerObj.capacity_available : 0,
        routePolyline: [
          [sourceCoords[1], sourceCoords[0]], // [lat, lng] for Leaflet
          [targetCoords[1], targetCoords[0]],
        ],
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 2. Priority 2 Actions: Relocate At-Risk Inundated Shelters
  atRiskShelters.slice(0, 5).forEach((shelter, idx) => {
    const sPt = shelter.geometry.type === 'Point' ? shelter : turf.centroid(shelter);
    const nearestShelter = findNearestAvailableShelter(sPt);

    const shelterName = shelter.name || `At-Risk Shelter #${idx + 1}`;
    const evacCount = Math.floor(Math.random() * 80) + 50;

    if (nearestShelter) {
      const trackerObj = shelterCapacityTracker.get(nearestShelter.shelterKey);
      if (trackerObj) {
        trackerObj.capacity_available = Math.max(0, trackerObj.capacity_available - evacCount);
      }

      const sourceCoords = sPt.geometry.coordinates;
      const targetCoords = nearestShelter.shelterPt.geometry.coordinates;

      recommendations.push({
        id: `plan-shelter-${idx + 1}-${Date.now()}`,
        priority: 'P2 - HIGH',
        type: 'Shelter Transfer',
        title: `Relocate ${shelterName}`,
        description: `Relocate ${evacCount} evacuees from flooded facility ${shelterName} to safe relief center ${nearestShelter.shelterFeature.name}.`,
        sourceLocation: shelterName,
        targetShelterName: nearestShelter.shelterFeature.name,
        estimatedPatients: evacCount,
        distanceKm: nearestShelter.distanceKm,
        allocatedCapacity: trackerObj ? trackerObj.capacity_available : 0,
        routePolyline: [
          [sourceCoords[1], sourceCoords[0]],
          [targetCoords[1], targetCoords[0]],
        ],
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 3. Fallback Priority 3: Supply Corridor Dispatch if no critical facility evacuations
  if (recommendations.length === 0 && safeShelters.length > 0) {
    const sampleShelter = safeShelters[0];
    recommendations.push({
      id: `plan-supply-${Date.now()}`,
      priority: 'P3 - STANDARD',
      type: 'Supply Line Dispatch',
      title: `Pre-position Clean Water & Rations at ${sampleShelter.name}`,
      description: `Dispatch mobile disaster relief units with potable water and emergency food packs to ${sampleShelter.name}.`,
      sourceLocation: 'Alappuzha Civil Station Logistics Hub',
      targetShelterName: sampleShelter.name,
      estimatedPatients: 150,
      distanceKm: 4.8,
      allocatedCapacity: 200,
      routePolyline: [
        [9.498, 76.338],
        [9.520, 76.350],
      ],
      timestamp: new Date().toISOString(),
    });
  }

  return recommendations;
}
