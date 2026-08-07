# Milestone 1: Project Foundation

## 1. Architecture

Milestone 1 establishes a two-app TypeScript workspace:

- `backend`: Express API with configuration validation, structured logging, MongoDB connection handling, audit logging, reusable error handling, and traceability models.
- `frontend`: React/Vite shell with typed environment access, API health service, and Mapbox token configuration.

Floods are isolated as the first hazard module at `backend/src/hazards/flood`. The core app imports hazard metadata through a registry so future hazards can be added without changing database, logging, or API infrastructure.

## 2. Why This Milestone Exists

The EOC must be replayable and auditable before it becomes intelligent. This milestone creates the durable substrate for later simulation, planning, approval, evaluation, and learning reports.

## 3. How It Integrates

Future milestones will reuse:

- `config/env.ts` for validated runtime configuration.
- `db/mongo.ts` for MongoDB Atlas connection lifecycle.
- `logging/logger.ts` for structured application logs.
- `audit/audit.service.ts` for durable trace events.
- `models/*` for replayable disaster events, datasets, decisions, approvals, and system health.
- `hazards/registry.ts` for disaster plugin registration.

## 4. Folder Structure

```text
backend/
  src/
    api/
    audit/
    config/
    db/
    errors/
    hazards/
      flood/
    logging/
    middleware/
    models/
    services/
    utils/
    validation/
    tests/
frontend/
  src/
    components/
    hooks/
    pages/
    services/
    config/
    tests/
docs/
```

## 5. Database Schema

MongoDB Atlas is the target database. Schemas are defined with Mongoose.

### `audit_events`

Stores every important system action and decision input/output.

- `eventType`: machine-readable event name.
- `actorType`: `system`, `human`, `sensor`, `planner`, or `simulation`.
- `actorId`: optional source identifier.
- `correlationId`: request or workflow correlation id.
- `hazardType`: optional hazard type, currently `flood`.
- `severity`: `debug`, `info`, `warn`, `error`, or `critical`.
- `payload`: structured event body.
- `createdAt`: immutable event timestamp.

Indexes:

- `{ createdAt: -1 }`
- `{ correlationId: 1, createdAt: 1 }`
- `{ hazardType: 1, createdAt: -1 }`

### `data_sources`

Tracks imported datasets and their reliability.

- `name`, `sourceType`, `provider`, `license`, `retrievedAt`, `checksum`, `metadata`.

### `disaster_events`

Represents a disaster replay or live incident.

- `hazardType`, `name`, `region`, `timeRange`, `status`, `metadata`.
- `region` is GeoJSON indexed with `2dsphere`.

### `decision_records`

Stores outputs from future estimate/planner/approval workflows.

- `loopStage`, `hazardType`, `correlationId`, `inputRefs`, `output`, `uncertainty`, `requiresHumanApproval`, `approvalRef`.

### `human_approvals`

Stores explicit human approval decisions. Nothing operational should execute without a related approval.

- `status`, `requestedBy`, `approvedBy`, `decisionRecordId`, `constraints`, `rationale`.

### `system_health_snapshots`

Stores operational health snapshots for reproducibility.

- `service`, `status`, `dependencies`, `observedAt`.

## 6. Backend

Implemented:

- `GET /health`
- `GET /api/hazards`
- environment validation
- Mongo connection lifecycle
- request id middleware
- error middleware
- audit service
- reusable validation helpers

## 7. Frontend

Implemented:

- Vite React TypeScript shell
- Tailwind configuration
- typed environment access
- API health service
- home page showing backend and Mapbox configuration state

Mapbox rendering belongs to Milestone 2 or later.

## 8. Tests

Backend:

- unit tests for environment parsing and hazard registry
- integration test for `GET /health`

Frontend:

- unit test for health response formatting

## 9. How To Verify

```bash
npm install
npm run typecheck
npm test
npm run build
```

Run backend locally:

```bash
cp backend/.env.example backend/.env
npm run dev:backend
curl http://localhost:4000/health
```

Run frontend locally:

```bash
cp frontend/.env.example frontend/.env
npm run dev:frontend
```

## 10. Acceptance Criteria

- The repository has separate frontend and backend workspaces.
- TypeScript compiles for both workspaces.
- Backend exposes a health endpoint.
- MongoDB connection settings are validated before server start.
- Audit events have a durable MongoDB model and service.
- Core traceability models exist for future decision loop stages.
- Flood is registered as a hazard module without implementing simulation.
- Unit and integration tests are present.
- Documentation explains setup, architecture, schema, API, and milestone boundaries.

## Incomplete Items

None within the Milestone 1 scope.

Simulation, ingestion, planner recommendations, human approval UI, Mapbox flood layers, offline behavior, and LLM integration belong to future milestones.
