import * as turf from '@turf/turf';
import { apiUrl } from './api';
import { x402Fetch } from './x402Client.js';


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

// --- AGENTIC RESPONSE PLANNER ---
// Extends the rule-based planner with an LLM reasoning layer.
// Calls /api/agentic-plan on the Express backend, which uses OpenAI if configured,
// or falls back to a mocked reasoning trace.
// Each recommendation includes a natural-language 'reasoning' field explaining the decision.
// The existing human-in-the-loop Approve/Reject gate is fully preserved.
export async function generateAgenticPlan({ atRiskHospitals, atRiskShelters, safeShelters, shelterCapacities }) {
  try {
    const response = await x402Fetch(apiUrl('/api/agentic-plan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atRiskHospitals: atRiskHospitals.map(h => ({
          name: h.properties?.name || h.properties?.['name:en'] || 'Unknown Hospital',
          properties: h.properties,
          geometry: h.geometry,
        })),
        atRiskShelters: atRiskShelters.slice(0, 5).map(s => ({
          name: s.name || 'Unknown Shelter',
          properties: s.properties,
          geometry: s.geometry,
        })),
        safeShelters: safeShelters.map(s => ({
          name: s.name || 'Unknown Safe Shelter',
        })),
        shelterCapacities,
      }),
    });

    if (!response.ok) throw new Error(`Agentic plan request failed: ${response.status}`);

    const data = await response.json();
    if (data.success && data.plans) {
      // Enrich agentic plans with map coordinates and routes
      const enrichedPlans = await enrichPlans(data.plans, { atRiskHospitals, atRiskShelters, safeShelters, shelterCapacities });
      return { plans: enrichedPlans, source: data.source };
    }
    throw new Error('Invalid agentic plan response');
  } catch (err) {
    console.warn('Agentic plan call failed, falling back to rule-based plan:', err);
    // Fallback to rule-based synchronous plan (and enrich it)
    const { fullPlans } = await generateFullEvacuationPlan({ atRiskHospitals, atRiskShelters, safeShelters, shelterCapacities });
    return { plans: fullPlans, source: 'fallback' };
  }
}
// --- END AGENTIC RESPONSE PLANNER ---

export async function enrichPlans(basePlans, { atRiskHospitals, atRiskShelters, safeShelters }) {
  return await Promise.all(basePlans.map(async (plan) => {
    // Determine the source feature (affected location)
    const sourceFeature = [...atRiskHospitals, ...atRiskShelters].find(f => {
      const name = f.properties?.name || f.properties?.['name:en'] || f.name;
      return name === plan.sourceLocation;
    });

    // Determine the target shelter feature
    const targetFeature = safeShelters.find(s => {
      const name = s.properties?.name || s.properties?.['addr:housename'] || s.name;
      return name === plan.targetShelterName;
    });

    // Build affected location object
    let affectedLocation = {
      name: plan.sourceLocation,
      coords: null,
      type: plan.type === 'Medical Evacuation' ? 'hospital' : 'shelter',
    };

    if (sourceFeature?.geometry) {
      try {
        const pt = sourceFeature.geometry.type === 'Point'
          ? sourceFeature
          : turf.centroid(sourceFeature);
        affectedLocation.coords = [pt.geometry.coordinates[1], pt.geometry.coordinates[0]]; // [lat, lng]
      } catch (e) { /* skip */ }
    } else if (plan.routePolyline?.[0]) {
      affectedLocation.coords = plan.routePolyline[0]; // Fallback to existing route start point
    }

    // Build assigned shelter
    let assignedShelter = {
      name: plan.targetShelterName,
      coords: null,
      capacityAvailable: plan.allocatedCapacity,
    };

    if (targetFeature?.geometry) {
      try {
        const pt = targetFeature.geometry.type === 'Point'
          ? targetFeature
          : turf.centroid(targetFeature);
        assignedShelter.coords = [pt.geometry.coordinates[1], pt.geometry.coordinates[0]];
      } catch (e) { /* skip */ }
    } else if (plan.routePolyline?.[1]) {
      assignedShelter.coords = plan.routePolyline[1];
    }

    // Build assigned hospitals list (relevant at-risk hospitals for this plan)
    const assignedHospitals = plan.type === 'Medical Evacuation'
      ? [{
          name: plan.sourceLocation,
          coords: affectedLocation.coords,
          estimatedPatients: plan.estimatedPatients,
        }]
      : [];

    let evacuationRoute = null;

    if (affectedLocation.coords && assignedShelter.coords) {
      let srcCoords = affectedLocation.coords; // [lat, lng]
      let dstCoords = assignedShelter.coords;
      let distanceKm = plan.distanceKm || 0;
      
      let fetchedPolyline = [srcCoords, dstCoords];
      let routeType = 'straight-line';
      let routeNote = 'Simplified straight-line route.';

      if (distanceKm <= 0 || (srcCoords[0] === dstCoords[0] && srcCoords[1] === dstCoords[1])) {
        distanceKm = 0;
        fetchedPolyline = []; // No route line for zero-distance
        routeNote = 'Source and destination are at the same location.';
      } else {
        // Try fetching detailed road route via OSRM Demo Server
        try {
          // OSRM expects: /route/v1/driving/{longitude},{latitude};{longitude},{latitude}
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${srcCoords[1]},${srcCoords[0]};${dstCoords[1]},${dstCoords[0]}?geometries=geojson`;
          const routeRes = await fetch(osrmUrl);
          if (routeRes.ok) {
            const routeData = await routeRes.json();
            if (routeData.routes && routeData.routes.length > 0) {
              const osrmRoute = routeData.routes[0];
              // OSRM returns coordinates as [lon, lat], Leaflet polyline needs [lat, lon]
              fetchedPolyline = osrmRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
              distanceKm = parseFloat((osrmRoute.distance / 1000).toFixed(2));
              routeType = 'osrm-road-network';
              routeNote = 'Detailed road network route via OSRM.';
            }
          }
        } catch (err) {
          console.warn('OSRM routing failed, falling back to straight line.', err);
        }
      }

      evacuationRoute = {
        from: srcCoords,
        to: dstCoords,
        distanceKm,
        polyline: fetchedPolyline,
        type: routeType,
        note: routeNote,
      };
      
      // Update the plan's overall distance if we got a better one from OSRM
      plan.distanceKm = distanceKm;
    }

    return {
      ...plan,
      affectedLocation,
      assignedShelters: [assignedShelter],
      assignedHospitals,
      evacuationRoutes: evacuationRoute ? [evacuationRoute] : [],
      timestamp: plan.timestamp || new Date().toISOString(),
    };
  }));
}

/**
 * @param {Object} params
 * @param {Array} params.atRiskHospitals - Hospitals inside the hazard extent
 * @param {Array} params.atRiskShelters  - Shelters inside the hazard extent
 * @param {Array} params.safeShelters    - Shelters outside the hazard extent
 * @param {Object} params.shelterCapacities - Capacity lookup data
 * @returns {{ plans: Array, fullPlans: Array }} — plans = original format, fullPlans = enriched
 */
export async function generateFullEvacuationPlan({ atRiskHospitals, atRiskShelters, safeShelters, shelterCapacities }) {
  // Step 1: Generate rule-based plans using existing logic (no modification)
  const basePlans = generateEvacuationPlan({ atRiskHospitals, atRiskShelters, safeShelters, shelterCapacities });

  // Step 2: Enrich each plan with structured evacuation data (now async for routing)
  const fullPlans = await enrichPlans(basePlans, { atRiskHospitals, atRiskShelters, safeShelters });

  return { plans: basePlans, fullPlans };
}
// --- END FULL EVACUATION PLAN GENERATOR ---
