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

  // --- PRIORITIZED EVACUATION ZONES FEATURE ---
  // Rank zones by a combination of flood exposure, road access, distance to safety, and available shelter capacity.
  // This logic is explicitly added to ensure planner and map agree on the priority order.
  
  // Step 1: Collect all at-risk zones (hospitals and shelters)
  let evacuationZones = [];

  atRiskHospitals.forEach((hospital, idx) => {
    evacuationZones.push({
      type: 'hospital',
      feature: hospital,
      name: hospital.properties?.name || hospital.properties?.['name:en'] || `Hospital Zone #${idx + 1}`,
      evacCount: Math.floor(Math.random() * 40) + 30, // 30-70 patients/staff
      floodExposure: 80, // Hospitals have higher base risk/exposure
      roadAccess: 70     // Estimated road access score
    });
  });

  atRiskShelters.slice(0, 5).forEach((shelter, idx) => {
    evacuationZones.push({
      type: 'shelter',
      feature: shelter,
      name: shelter.name || `At-Risk Shelter #${idx + 1}`,
      evacCount: Math.floor(Math.random() * 80) + 50,
      floodExposure: 50, // Base flood exposure
      roadAccess: 60     // Estimated road access score
    });
  });

  // Step 2: Calculate scores for each zone to rank them
  evacuationZones.forEach(zone => {
    const pt = zone.feature.geometry.type === 'Point' ? zone.feature : turf.centroid(zone.feature);
    zone.pt = pt;
    
    // Find nearest shelter to evaluate distance to safety and available capacity
    const nearest = findNearestAvailableShelter(pt);
    
    let distanceScore = 0;
    let capacityScore = 0;
    
    if (nearest) {
      // Higher score for closer distance to safety
      distanceScore = Math.max(0, 50 - nearest.distanceKm); 
      // Higher score for more available capacity
      capacityScore = Math.min(50, nearest.capacityData.capacity_available / 5);
    }
    
    // Final combination of factors
    zone.score = zone.floodExposure + zone.roadAccess + distanceScore + capacityScore;
  });

  // Step 3: Sort zones by highest score first (Priority Ranking)
  evacuationZones.sort((a, b) => b.score - a.score);

  // Step 4: Process zones in priority order
  evacuationZones.forEach((zone, index) => {
    const nearestShelter = findNearestAvailableShelter(zone.pt);
    if (!nearestShelter) return; // Skip if no safe shelter available
    
    // Deduct allocated capacity from the tracker
    const trackerObj = shelterCapacityTracker.get(nearestShelter.shelterKey);
    if (trackerObj) {
      trackerObj.capacity_available = Math.max(0, trackerObj.capacity_available - zone.evacCount);
    }

    const sourceCoords = zone.pt.geometry.coordinates;
    const targetCoords = nearestShelter.shelterPt.geometry.coordinates;

    // Assign clear priority labels based on ranking
    let priorityLabel = 'LOW';
    if (index === 0) priorityLabel = 'CRITICAL';
    else if (index === 1) priorityLabel = 'HIGH';
    else if (index === 2) priorityLabel = 'MEDIUM';

    recommendations.push({
      id: `plan-${zone.type}-${index + 1}-${Date.now()}`,
      priority: priorityLabel,
      type: zone.type === 'hospital' ? 'Medical Evacuation' : 'Shelter Transfer',
      title: zone.type === 'hospital' ? `Evacuate ${zone.name}` : `Relocate ${zone.name}`,
      description: zone.type === 'hospital' 
        ? `Transfer ${zone.evacCount} high-risk patients and medical personnel from ${zone.name} to designated safe hub ${nearestShelter.shelterFeature.name}.`
        : `Relocate ${zone.evacCount} evacuees from flooded facility ${zone.name} to safe relief center ${nearestShelter.shelterFeature.name}.`,
      sourceLocation: zone.name,
      targetShelterName: nearestShelter.shelterFeature.name,
      estimatedPatients: zone.evacCount,
      distanceKm: nearestShelter.distanceKm,
      allocatedCapacity: trackerObj ? trackerObj.capacity_available : 0,
      routePolyline: [
        [sourceCoords[1], sourceCoords[0]],
        [targetCoords[1], targetCoords[0]],
      ],
      timestamp: new Date().toISOString(),
    });
  });

  // --- END PRIORITIZED EVACUATION ZONES FEATURE ---

  // Fallback: Supply Corridor Dispatch if no facility evacuations
  if (recommendations.length === 0 && safeShelters.length > 0) {
    const sampleShelter = safeShelters[0];
    recommendations.push({
      id: `plan-supply-${Date.now()}`,
      priority: 'LOW',
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
