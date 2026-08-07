# ADR-003: Flood-Aware Evacuation Routing & Dynamic Shelter Capacity Manager

## Context

During disaster operations, standard shortest-path routing algorithms fail because they route evacuees directly through inundated flood zones or blocked roads. Additionally, sending evacuees to overwhelmed shelters creates severe secondary humanitarian risks.

We needed to decide how to handle safe path calculation and shelter allocation.

## Decision

We decided to implement:
1. **Flood-Aware Waypoint-Bypass Routing**: Evaluating straight-line trajectories against active `flood_polygons` and `affected_facilities`. When an intersection is detected, the engine dynamically interpolates safe detour waypoints around the flood polygon bounding box buffer.
2. **Dynamic Shelter Capacity Allocation**: Evaluating nearest shelter distance alongside available capacity ($\text{maxCapacity} - \text{currentOccupancy} > 0$). Evacuees are assigned only to shelters with open capacity, with automatic status transitions (`open` $\to$ `near_capacity` $\to$ `full`).

## Consequences

- **Pros**:
  - Guarantees evacuees are not routed into active flood zones.
  - Prevents shelter overcrowding.
  - Provides clear inputs for Milestone 7 (Agentic Decision Planner).
- **Cons**:
  - Bounding box detour interpolation requires open space around flood perimeters.

## Status

Accepted and implemented in Milestone 6.
