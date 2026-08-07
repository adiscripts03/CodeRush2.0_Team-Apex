# ADR-006: Fault-Tolerant Resilience Architecture & Offline Mode

## Context

In extreme disaster scenarios (such as severe regional flooding), ground telecommunications networks experience severe degradation, satellite coverage is obstructed by heavy rain clouds, and command operators may lose internet connectivity while deployed in field operations.

We needed to decide how to handle active failure simulation, degraded fallbacks, and offline action queuing.

## Decision

We decided to implement:
1. **Active Fault Injection Engine**: Exposing API controls (`POST /simulation/inject-failure`) to synthetically inject telecom outages, satellite sensor loss, road failures, and API latency to continuously test EOC resilience.
2. **Graceful Degraded Fallbacks**: When satellite NDWI sensors fail due to cloud cover, the system automatically switches to a rainfall trend expansion heuristic, penalizing decision confidence (70%) while ensuring operational continuity.
3. **Client-Side Offline Queue Replay**: When client connectivity drops (`navigator.onLine === false`), command approval requests are queued in persistent client storage and automatically replayed upon network reconnection.

## Consequences

- **Pros**:
  - Ensures the EOC remains functional during severe infrastructure failures.
  - Prevents data loss during network disconnects via offline queue replay.
  - Exposes empirical resilience metrics via `GET /health/resilience`.
- **Cons**:
  - Degraded mode fallback heuristics trade precision for availability.

## Status

Accepted and implemented in Milestone 9.
