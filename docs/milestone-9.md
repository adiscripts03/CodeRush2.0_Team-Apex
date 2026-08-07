# Milestone 9: Resilience, Failure Simulation & Offline Mode Engine

## 1. Goal

Implement the **Resilience, Failure Simulation & Offline Mode Engine** to evaluate system fault tolerance under severe real-world disaster conditions (telecom tower outages, satellite cloud blockages, road network failures, shelter overflows, network latency, and connectivity loss).

## 2. Features Implemented

- **Active Failure Simulator**:
  - `comms_tower_outage`: Simulates synthetic network degradation and service unavailability.
  - `sensor_data_loss`: Simulates satellite cloud cover obstruction and missing NDWI telemetry.
  - `road_network_failure`: Simulates sudden road segment collapse.
  - `shelter_overflow`: Simulates shelter capacity exhaustion.
  - `network_latency`: Simulates synthetic API latency injection.
- **Degraded Operations Mode**:
  - Automatically falls back to trend-extrapolated flood extent calculations when satellite NDWI data is obstructed, applying a rainfall expansion factor and a 70% degraded confidence penalty.
- **Client-Side Offline Action Queue**:
  - Stores approval and rejection requests in `localStorage` when client connectivity is lost (`navigator.onLine === false`).
  - Automatically replays queued actions when network connection is restored.
- **Resilience Health Monitor**:
  - Extended resilience health endpoint returning active failure counts, degraded mode state, and a 0-100 Uptime Resilience Index.
- **Resilience Dashboard Panel**:
  - Interactive UI rendering failure simulator controls, active fault pills, resilience index progress bar, and offline queue replay counter.

## 3. Database Schema

### `failure_injections`
- `injectionId`: Unique failure injection identifier.
- `failureType`: `comms_tower_outage` | `sensor_data_loss` | `road_network_failure` | `shelter_overflow` | `network_latency`.
- `targetComponent`: Target infrastructure component.
- `parameters`: `{ latencyMs, errorRate, affectedZones }`.
- `active`: Boolean flag indicating if failure injection is active.
- `injectedAt`: Datetime.

## 4. API Reference

- `POST /simulation/inject-failure` (and `/api/simulation/inject-failure`) — Injects synthetic failure condition.
- `POST /simulation/clear-failures` (and `/api/simulation/clear-failures`) — Clears active failure injections.
- `GET /simulation/active-failures` (and `/api/simulation/active-failures`) — Lists active failure injections.
- `GET /health/resilience` (and `/api/health/resilience`) — Returns resilience health metrics & degraded mode status.

## 5. Tests

Backend:
- `failure-simulator.test.ts` — Failure injection activation, querying, clearing.
- `degraded-estimator.test.ts` — Primary vs fallback flood extent estimation & confidence penalty calculations.
- `resilience-health.test.ts` — Resilience index and health metrics calculations.
- `simulation.integration.test.ts` — Integration tests for `/simulation/inject-failure`, `/simulation/clear-failures`, `/simulation/active-failures`, `/health/resilience`.

Frontend:
- `offlineQueue.service.test.ts` — Client-side offline action queuing, storage persistence, and replay sync.
- `systemResiliencePanel.test.tsx` — Component render tests for failure simulator controls & resilience metrics.

## 6. Architecture Decision Record (ADR)
See [ADR-006-fault-tolerant-resilience-architecture-offline-mode.md](file:///d:/Coding/CodeRush2.0_Team-Apex/docs/adr/ADR-006-fault-tolerant-resilience-architecture-offline-mode.md).

## 7. Technical Debt
- Offline action queue persists in `localStorage`. Migration to IndexedDB can be added in future iterations for large-payload offline attachments.

## 8. Prerequisites for Milestone 10 (Evaluation, Learning Loop & Demo Readiness)
- Milestone 9 establishes system fault tolerance and offline resilience. Milestone 10 will build the post-disaster Evaluation Engine, Learning Loop (comparing predicted vs actual impact), and final demo readiness.
