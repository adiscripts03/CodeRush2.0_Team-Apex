# Kerala Floods EOC

Simulation-first Emergency Operations Center foundation for replayable Kerala Floods 2018 disaster management workflows.

Milestone 1 creates the project foundation only: configuration, logging, MongoDB connection handling, audit/event schemas, health checks, frontend shell, tests, and setup documentation.

Milestone 2 adds the GIS layer: GeoJSON imports, MongoDB `2dsphere` storage, geospatial APIs, and Mapbox rendering for districts, roads, rivers, hospitals, shelters, and population.

## Architecture

The system follows the core decision loop:

Observe -> Estimate -> Explain uncertainty -> Plan within constraints -> Human approval -> Simulation execution -> Evaluation -> Learning report -> Observe again

Milestone 1 does not implement the loop behavior. It creates the traceable substrate that future milestones will use to store every observation, estimate, recommendation, approval, execution, and evaluation.

Floods are represented as the first hazard module under `backend/src/hazards/flood`. Future hazards must register through the same module boundary instead of changing core infrastructure.

## Workspace

- `backend`: Express, TypeScript, MongoDB/Mongoose, audit logging, health checks.
- `frontend`: React, TypeScript, Vite, TailwindCSS, Mapbox configuration shell.
- `docs`: milestone architecture, schema, API, setup, and acceptance criteria.

## Quick Start

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run typecheck
npm test
```

Import local GIS fixtures after configuring backend MongoDB:

```bash
npm run import:gis:fixtures --workspace backend
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
