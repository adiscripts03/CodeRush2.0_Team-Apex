# Kerala Floods EOC

Simulation-first Emergency Operations Center foundation for replayable Kerala Floods 2018 disaster management workflows.

Milestone 1 creates the project foundation only: configuration, logging, MongoDB connection handling, audit/event schemas, health checks, frontend shell, tests, and setup documentation.

Milestone 2 adds the GIS layer: GeoJSON imports, MongoDB `2dsphere` storage, geospatial APIs, and Mapbox rendering for districts, roads, rivers, hospitals, shelters, and population.

Milestone 3 implements the Historical Replay Engine: timeline models, snapshot loader, timestamp controller, playback controls, step forward/backward, time slider, API endpoints, and audit logging.

Milestone 4 implements the Flood Detection & Change Detection Engine: Sentinel-2 NDWI band extraction, GeoJSON polygon generation, confidence scoring, spatial expansion/recession change detection (Turf.js), Mapbox change overlays, and flood intelligence APIs (`/flood/current`, `/flood/history`, `/flood/detect`, `/flood/change/:timestamp`).

Milestone 5 implements the Impact Assessment Engine: intersecting flood extent polygons with GIS layers (population, roads, hospitals, shelters, schools, districts), calculating affected population, blocked road length (km), inundated critical facilities, estimated shelter demand (20% displacement ratio), severity scoring (0.0 to 1.0 / Low to Critical), and impact APIs (`/impact/:timestamp`, `/impact/summary`, `/impact/population`, `/impact/infrastructure`).

Milestone 6 implements the Resource Inventory & Evacuation Routing Engine: disaster asset tracking (rescue boats, ambulances, medical teams, food stock), shelter capacity manager, flood-aware waypoint-bypass routing, safety status calculation (`safe`, `caution`, `blocked`), Mapbox safe route rendering, and resource/route APIs (`/resources`, `/resources/update`, `/routes/evacuation`, `/routes/safe`).

Milestone 7 implements the Agentic Decision Planner Engine: 5-stage decision loop (Observe -> Estimate -> Explain -> Plan -> Review), 6 recommendation action types (open shelters, deploy rescue boats, close roads, send medical teams, prioritize districts, schedule reviews), reasoning traces, linked evidence metrics, confidence scoring, constraint checking, evaluated alternatives, and planner APIs (`/planner/run`, `/planner/recommendations`, `/planner/explanation/:id`).

Milestone 8 implements the Human Approval Workflow & Audit Trail Engine: command approval oversight gate, mandatory rejection reason validation, automated simulation side-effect triggers (`open_shelter`, `deploy_rescue_boats`, `send_medical_team`), immutable audit event stream (`approval.granted`, `approval.rejected`, `recommendation.executed`), approval dashboard UI, decision history, audit timeline viewer, and approval/audit APIs (`/approvals`, `/approvals/approve`, `/approvals/reject`, `/audit/timeline`).

Milestone 9 implements the Resilience, Failure Simulation & Offline Mode Engine: active failure simulator controls (`comms_tower_outage`, `sensor_data_loss`, `road_network_failure`, `shelter_overflow`, `network_latency`), degraded operations mode fallback algorithms, client-side offline action queue replay sync, extended resilience health metrics (`resilienceIndex`), system resilience panel UI, and simulation APIs (`/simulation/inject-failure`, `/simulation/clear-failures`, `/simulation/active-failures`, `/health/resilience`).

## Architecture

The system follows the core decision loop:

Observe -> Estimate -> Explain uncertainty -> Plan within constraints -> Human approval -> Simulation execution -> Evaluation -> Learning report -> Observe again

Milestone 1 creates the traceable substrate. Milestone 2 adds GIS base layers. Milestone 3 provides time-aware historical replay. Milestone 4 provides satellite flood extent detection & spatial change analysis. Milestone 5 provides real-time impact assessment & severity evaluation. Milestone 6 provides resource inventory management & flood-aware safe evacuation routing. Milestone 7 provides explainable agentic decision planning. Milestone 8 provides human command approval governance and immutable audit logging. Milestone 9 provides resilience fault simulation and offline action queue persistence.

Floods are represented as the first hazard module under `backend/src/hazards/flood`. Future hazards must register through the same module boundary instead of changing core infrastructure.

## Workspace

- `backend`: Express, TypeScript, MongoDB/Mongoose, audit logging, health checks, GIS, replay, flood detection, impact assessment, resource routing, agentic planner, human approvals, resilience simulator.
- `frontend`: React, TypeScript, Vite, TailwindCSS, Mapbox visualizer, replay controls, flood intelligence panel, impact summary panel, resource inventory panel, planner decision panel, human approval panel, system resilience panel.
- `docs`: milestone architecture, schema, API, setup, ADRs, and acceptance criteria.

## Quick Start

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run typecheck
npm test
```

Import local GIS fixtures, replay sample data, flood detection data, and resource fixtures:

```bash
npm run import:gis:fixtures --workspace backend
npm run import:replay:fixtures --workspace backend
npm run import:flood --workspace backend
npm run import:resources:fixtures --workspace backend
```

Development servers:

```bash
npm run dev:backend
npm run dev:frontend
```

Backend health check:

```bash
curl http://localhost:4000/health
```

## Required Environment

Backend:

- `MONGODB_URI`: MongoDB Atlas connection string.
- `MONGODB_DB_NAME`: database name.
- `NODE_ENV`: `development`, `test`, or `production`.
- `PORT`: backend port.
- `LOG_LEVEL`: pino log level.

Frontend:

- `VITE_API_BASE_URL`: backend base URL.
- `VITE_MAPBOX_ACCESS_TOKEN`: Mapbox public access token.


## Milestone 1 Boundary

Implemented:

- TypeScript frontend and backend configuration.
- Modular folder structure.
- Environment validation.
- Structured logging.
- MongoDB connection utility.
- Audit logging model and service.
- Core traceability database models.
- Health check endpoint.
- Unit and integration tests.
- Documentation and acceptance criteria.

Not implemented:

- Flood replay, timestep simulation, ingestion pipelines, planning, approval workflows, Mapbox rendering, LLM calls, offline sync, or deployment automation.

These belong to later milestones.
