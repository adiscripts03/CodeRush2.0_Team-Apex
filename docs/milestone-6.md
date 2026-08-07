# Milestone 6: Resource Inventory & Evacuation Routing

## 1. Goal

Build the **Resource Inventory & Evacuation Routing Engine** to model emergency disaster assets (rescue boats, ambulances, medical teams, food stock), manage shelter capacity constraints, and calculate flood-aware safe evacuation routes bypassing active flood extent polygons and blocked road segments.

## 2. Features Implemented

- **Resource & Fleet Asset Management**: Tracks emergency assets (boats, ambulances, medical units, volunteers, food stock) with `2dsphere` locations and availability status (`available`, `deployed`, `maintenance`).
- **Shelter Capacity Manager**: Manages shelter capacity limits, updates occupancy when evacuees arrive, and handles status transitions (`open` $\to$ `near_capacity` $\to$ `full`).
- **Flood-Aware Waypoint-Bypass Routing**: Interpolates safe LineString route coordinates around active `flood_polygons` and blocked roads.
- **Safety Rating Evaluator**: Assigns route safety status (`safe` = 0% flood overlap, `caution` = near flood boundary detour, `blocked` = origin or destination trapped).
- **Resource & Routing APIs**: Endpoints for resource listing, asset status updates, evacuation route generation to nearest available shelter, and safe point-to-point routing.
- **Mapbox Visualizer**: Renders green dashed evacuation route LineStrings on Mapbox GL JS with shelter markers.

## 3. Database Schema

### `resources`
- `type`: `rescue_boat` | `ambulance` | `medical_team` | `volunteer` | `food_stock`.
- `name`: Display name.
- `quantity`: Count or amount.
- `unit`: `boats` | `vehicles` | `persons` | `kg`.
- `location`: Point `[lng, lat]` with `2dsphere` index.
- `status`: `available` | `deployed` | `maintenance`.

### `vehicles`
- `vehicleId`: Unique vehicle identifier.
- `type`: `rescue_boat` | `ambulance` | `truck` | `helicopter`.
- `passengerCapacity`: Maximum passenger capacity.
- `currentLocation`: Point `[lng, lat]` with `2dsphere` index.
- `status`: `available` | `deployed` | `en_route` | `maintenance`.

### `shelter_capacities`
- `shelterId`: Unique shelter identifier.
- `name`: Shelter name.
- `maxCapacity`: Total shelter capacity.
- `currentOccupancy`: Current evacuees count.
- `availableCapacity`: Remaining capacity.
- `location`: Point `[lng, lat]` with `2dsphere` index.
- `status`: `open` | `near_capacity` | `full` | `flooded`.
- `supplies`: `{ foodRationsKg, medicalKits, drinkingWaterLiters }`.

### `route_plans`
- `origin`: `{ name, coordinates: [lng, lat] }`.
- `destination`: `{ name, coordinates: [lng, lat] }`.
- `path`: GeoJSON `LineString` with `2dsphere` index.
- `totalDistanceKm`: Route distance in $\text{km}$.
- `estimatedTimeMinutes`: Estimated travel time in minutes.
- `safetyStatus`: `safe` | `caution` | `blocked`.
- `avoidedFloodAreaKm2`: Area of flood extent bypassed.

## 4. API Reference

- `GET /resources` (and `/api/resources`) — Returns all resources, vehicles, and shelter capacities.
- `POST /resources/update` (and `/api/resources/update`) — Updates resource quantity, status, or shelter occupancy.
- `GET /routes/evacuation` (and `/api/routes/evacuation`) — Calculates evacuation route to nearest open shelter with available capacity.
- `GET /routes/safe` (and `/api/routes/safe`) — Calculates safe point-to-point route bypassing active flood polygons.

## 5. Tests

Backend:
- `routing-engine.test.ts` — Direct pathing, flood detour waypoint interpolation, trapped blocked path detection.
- `resource-manager.test.ts` — Nearest shelter selection, capacity allocation limits, status transitions.
- `resource.integration.test.ts` — Integration tests for `/resources`, `/resources/update`, `/routes/evacuation`, `/routes/safe`.

Frontend:
- `resourceInventoryPanel.test.tsx` — Component render tests for shelter progress bars, vehicle counters, and route planner widget.

## 6. Architecture Decision Record (ADR)
See [ADR-003-flood-aware-evacuation-routing.md](file:///d:/Coding/CodeRush2.0_Team-Apex/docs/adr/ADR-003-flood-aware-evacuation-routing.md).

## 7. Technical Debt
- Waypoint detour interpolation currently projects bounding box offsets. Integration with OpenStreetMap graph network engines (e.g. OSRM / Valhalla) can be added in future iterations for street-level turn-by-turn navigation.

## 8. Prerequisites for Milestone 7 (Agentic Decision Planner)
- Milestone 6 provides resource inventory counts (`GET /resources`), shelter capacities, and safe route pathing (`GET /routes/evacuation`), supplying the exact resource availability and mobility constraints required by the Milestone 7 Agentic Decision Planner.
