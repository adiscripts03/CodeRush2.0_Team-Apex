# ADR-002: Spatial Impact Intersection & Severity Scoring Engine

## Context

The Emergency Operations Center (EOC) must determine what infrastructure, road segments, health facilities, and human populations are impacted when a flood snapshot is detected.

We needed to decide how to perform spatial impact calculations and quantify disaster severity.

## Decision

We decided to implement:
1. **Indexed Spatial Intersection**: Using MongoDB `$geoIntersects` query operators backed by `2dsphere` indexes on both `gis_features` and `flood_polygons`, with Turf.js in-memory spatial intersection (`turf.booleanIntersects`) for unit tests and fallback evaluations.
2. **Normalized Multi-Factor Severity Model**:
   $$\text{Severity Score} = \min\left(1.0, 0.4 \times \frac{\text{AffectedPopulation}}{100,000} + 0.3 \times \frac{\text{BlockedRoadLengthKm}}{50} + 0.3 \times \frac{\text{Hospitals}}{10}\right)$$
3. **Displacement Ratio Shelter Demand Estimator**: Estimating immediate shelter capacity demand as 20% of the affected population.

## Consequences

- **Pros**:
  - Leverages existing Milestone 2 `gis_features` and Milestone 4 `flood_polygons` without duplicating geometry assets.
  - Computes instant impact metrics (< 50ms) per timeline timestep.
  - Provides structured inputs directly into Milestone 6 (Evacuation Routing & Resource Allocation) and Milestone 7 (Agentic Decision Planner).
- **Cons**:
  - Linear road length estimation relies on Turf LineString calculations.

## Status

Accepted and implemented in Milestone 5.
