# Kerala Floods EOC Intelligence Engine

Simulation-first Emergency Operations Center platform for replayable Kerala Floods 2018 disaster management workflows. Built across 10 complete engineering milestones with satellite flood extent detection, spatial change analysis, real-time impact assessment, safe evacuation routing, explainable agentic decision planning, human-in-the-loop command governance, fault-tolerant resilience simulation, ground truth evaluation, and post-disaster learning loops.

---

## 8-Stage Decision Loop Lifecycle

$$\text{Observe} \longrightarrow \text{Estimate} \longrightarrow \text{Explain Uncertainty} \longrightarrow \text{Plan Within Constraints} \longrightarrow \text{Human Approval} \longrightarrow \text{Simulated Execution} \longrightarrow \text{Evaluate} \longrightarrow \text{Learning Report}$$

---

## Key Features & Milestone Summary

1. **Milestone 1 — Foundation & Architecture**: Express TypeScript backend, Pino logging, Mongo audit logging, health check endpoints, environment validation, reusable layer architecture.
2. **Milestone 2 — GIS Infrastructure**: MongoDB GeoJSON (`2dsphere` indexed) layers for Kerala districts, roads, rivers, hospitals, shelters, and population density points, rendered in Mapbox GL.
3. **Milestone 3 — Historical Replay Engine**: Time-aware snapshot state machine, playback controller (Play/Pause, Scrub, Step Forward/Backward, 1x–8x Speed), historical event timeline endpoints.
4. **Milestone 4 — Flood Detection & Spatial Change Analysis**: Sentinel-2 NDWI band extraction, GeoJSON polygon generation, Turf.js spatial expansion/recession change detection, and Mapbox change overlays.
5. **Milestone 5 — Real-time Impact Assessment Engine**: Spatial intersection analysis calculating affected population, submerged highway length (km), inundated hospitals, shelter demand (20% displacement ratio), and severity scoring (Low to Critical).
6. **Milestone 6 — Resource Inventory & Safe Evacuation Routing**: Rescue boat fleets, medical teams, shelter capacity manager, and flood-aware waypoint bypass routing engine.
7. **Milestone 7 — Agentic Decision Planner Engine**: 5-stage decision loop (Observe $\to$ Estimate $\to$ Explain $\to$ Plan $\to$ Review) producing 6 recommendation action types with reasoning traces, evidence metrics, constraints, and evaluated trade-offs.
8. **Milestone 8 — Human Approval Workflow & Audit Trail Engine**: Mandatory command approval gates (`proposed` $\to$ `approved` $\to$ `executed` / `rejected`), mandatory rejection reason validation, automated simulation side-effects (`open_shelter`, `deploy_rescue_boats`), and immutable audit event logging.
9. **Milestone 9 — Resilience, Failure Simulator & Offline Mode**: Active fault injection (`comms_tower_outage`, `sensor_data_loss`, `road_network_failure`, `shelter_overflow`, `network_latency`), rainfall-trend degraded mode fallbacks, client-side offline action queue persistence (`localStorage`), and offline replay sync.
10. **Milestone 10 — Evaluation, Learning Loop & Demo Readiness**: Ground truth evaluation engine comparing predictions against Kerala 2018 historical data across 9 metrics (**Flood IoU: 0.84**, **Precision: 0.89**, **Recall: 0.91**, **Lead Time: 18.5h**, **100% Route Feasibility**), post-disaster learning report generator, confidence calibration curve, full 8-stage decision cycle dashboard UI, and hackathon presentation deliverables.

---

## Environment Variables & `.env` Setup

### 1. Backend (`backend/.env`)
Create `backend/.env` with the following variables:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
MONGO_URI=mongodb://localhost:27017/kerala_floods_eoc
CORS_ORIGIN=http://localhost:5173
```

> **Note on MongoDB**: If local MongoDB is running at `mongodb://localhost:27017/kerala_floods_eoc`, the application connects directly. If MongoDB is unavailable, in-memory MongoDB Memory Server is automatically utilized during testing.

### 2. Frontend (`frontend/.env`)
Create `frontend/.env` with your Mapbox Access Token:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_public_access_token_here
```

---

## How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run TypeScript Type Checker
```bash
npm run typecheck
```

### 3. Run Complete Automated Test Suite (187 Tests)
```bash
npm test
```

### 4. Seed Historical Fixtures & GIS Data (Optional)
```bash
npm run seed --workspace=@kerala-eoc/backend
```

### 5. Start Application in Development Mode
To run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend Dashboard**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:3000`

### 6. Production Build
```bash
npm run build
```

---

## Documentation & Architecture Index

- [docs/milestone-10.md](docs/milestone-10.md) — Milestone 10 architecture & evaluation guide.
- [docs/adr/README.md](docs/adr/README.md) — Complete ADR Index (ADR-001 through ADR-007).
- [docs/dataset-provenance.md](docs/dataset-provenance.md) — Sentinel-2, OpenStreetMap & KSDMA data sources.
- [docs/architecture-diagrams.md](docs/architecture-diagrams.md) — C4 & sequence architecture diagrams.
- [docs/demo-script.md](docs/demo-script.md) — Step-by-step judge presentation script.
- [docs/demo-checklist.md](docs/demo-checklist.md) — Hackathon demonstration checklist.
- [docs/submission-checklist.md](docs/submission-checklist.md) — Final submission checklist.
- [docs/api.md](docs/api.md) — Comprehensive API Reference.
