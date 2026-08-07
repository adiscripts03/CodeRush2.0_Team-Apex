# Milestone 5: Impact Assessment Engine

## 1. Goal

Build the **Impact Assessment Engine** to estimate what detected flood polygons affect across population, road networks, critical health/shelter facilities, and district administrative boundaries.

## 2. Features Implemented

- **GIS Layer Spatial Intersection**: Intersects GeoJSON flood extent polygons from Milestone 4 with Milestone 2 GIS layers (`district_boundary`, `road`, `hospital`, `shelter`, `population`) using MongoDB `$geoIntersects` and Turf.js.
- **Affected Population Calculation**: Aggregates exposed population counts across flooded spatial zones and produces district-level exposure breakdowns.
- **Blocked Road & Infrastructure Querying**: Tracks inundated hospital facilities, isolated shelters, flooded schools, and blocked road segment lengths ($\text{km}$).
- **Shelter Demand Estimator**: Estimates immediate shelter demand using a 20% displacement ratio of affected population.
- **Severity Scoring Model**:
  $$\text{Severity Score} = \min\left(1.0, 0.4 \times \frac{\text{Pop}}{100,000} + 0.3 \times \frac{\text{BlockedKm}}{50} + 0.3 \times \frac{\text{Hospitals}}{10}\right)$$
  - Maps to severity levels: `low` (< 0.3), `medium` (< 0.6), `high` (< 0.8), `critical` ($\ge$ 0.8).
- **Impact Summary Panel**: Frontend visual dashboard exposing severity badge, affected population, shelter demand, blocked road length, critical facilities count, and district vulnerability table.

## 3. Database Schema

### `impact_assessments`
- `timestamp`: Datetime.
- `snapshotId`: Reference to `FloodSnapshot`.
- `affectedPopulationCount`: Total exposed population count.
- `blockedRoadCount`: Number of inundated road segments.
- `blockedRoadLengthKm`: Total blocked road length in $\text{km}$.
- `affectedHospitalCount`: Flooded hospital count.
- `affectedShelterCount`: Flooded shelter count.
- `affectedSchoolCount`: Flooded school count.
- `totalCriticalFacilities`: Sum of affected critical facilities.
- `shelterDemandEstimate`: Estimated displacement shelter capacity needed.
- `severityScore`: Computed severity index (0.0 to 1.0).
- `severityLevel`: `low` | `medium` | `high` | `critical`.
- `districtBreakdown`: Array of `{ district, affectedPopulation, floodedAreaKm2 }`.

### `affected_facilities`
- `assessmentId`: Reference to `ImpactAssessment`.
- `timestamp`: Datetime.
- `facilityId`: GIS external identifier.
- `facilityName`: Display name.
- `facilityType`: `hospital` | `shelter` | `school` | `road`.
- `geometry`: GeoJSON point/linestring/polygon with `2dsphere` index.
- `status`: `flooded` | `partially_blocked` | `isolated` | `operational_risk`.

### `affected_populations`
- `assessmentId`: Reference to `ImpactAssessment`.
- `timestamp`: Datetime.
- `districtName`: District name.
- `totalPopulation`: Baseline district population.
- `exposedPopulation`: Exposed population count.
- `exposurePercentage`: Percentage of district population exposed.
- `geometry`: GeoJSON boundary polygon with `2dsphere` index.

## 4. API Reference

- `GET /impact/:timestamp` (and `/api/impact/:timestamp`) — Returns full impact assessment for a specific timestamp.
- `GET /impact/summary` (and `/api/impact/summary`) — Returns latest impact assessment summary.
- `GET /impact/population` (and `/api/impact/population`) — Returns affected population exposure breakdown.
- `GET /impact/infrastructure` (and `/api/impact/infrastructure`) — Returns list of all affected facilities and blocked road segments.

## 5. Tests

Backend:
- `impact-calculator.test.ts` — Severity formula math, severity level thresholds, shelter demand estimation ratio, polygon spatial intersection.
- `impact.integration.test.ts` — Full API integration tests for `/impact/:timestamp`, `/impact/summary`, `/impact/population`, and `/impact/infrastructure`.

Frontend:
- `impactSummaryPanel.test.tsx` — Component render tests for severity badge, stat cards, and district exposure table.

## 6. Architecture Decision Record (ADR)
See [ADR-002-spatial-impact-intersection.md](file:///d:/Coding/CodeRush2.0_Team-Apex/docs/adr/ADR-002-spatial-impact-intersection.md).

## 7. Technical Debt
- Population spatial density weighting currently uses gridded population estimates. Sub-district Census ward polygon boundaries can be added in future iterations for sub-building level granularity.

## 8. Prerequisites for Milestone 6 (Resource Inventory & Evacuation Routing)
- Milestone 5 exposes affected infrastructure (`GET /impact/infrastructure`), blocked road segments, and shelter demand (`GET /impact/summary`), providing the exact blocked path constraints and capacity demands required for Milestone 6 safe evacuation routing and resource allocation.
