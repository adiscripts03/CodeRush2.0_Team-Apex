# Architecture Decision Records (ADR Index)

This directory documents the key architectural and design decisions made throughout the development of the Kerala Floods EOC Intelligence Engine across Milestones 1 through 10.

| ADR ID | Title | Summary | Milestone | Status |
|--------|-------|---------|-----------|--------|
| [ADR-001](ADR-001-mongodb-geojson-and-mapbox-architecture.md) | MongoDB GeoJSON & Mapbox Architecture | Standardizing spatial features on GeoJSON and MongoDB `2dsphere` indexes | Milestone 2 | Accepted |
| [ADR-002](ADR-002-historical-replay-and-snapshot-loader.md) | Historical Replay & Snapshot Loader | Time-aware snapshot immutability and playback state machine | Milestone 3 | Accepted |
| [ADR-003](ADR-003-ndwi-satellite-flood-extent-and-change-detection.md) | NDWI Flood Extent & Spatial Change Detection | Sentinel-2 spectral NDWI band thresholding and Turf.js spatial diff | Milestone 4 | Accepted |
| [ADR-004](ADR-004-impact-assessment-and-evacuation-routing.md) | Impact Assessment & Evacuation Routing Engine | Spatial intersection scoring and flood-aware waypoint bypass routing | Milestones 5 & 6 | Accepted |
| [ADR-005](ADR-005-human-approval-governance-audit-trail.md) | Human Approval Governance & Audit Trail | Mandatory command approval gates, rejection reasons, and audit logging | Milestones 7 & 8 | Accepted |
| [ADR-006](ADR-006-fault-tolerant-resilience-architecture-offline-mode.md) | Fault-Tolerant Resilience Architecture & Offline Mode | Active fault simulation, degraded fallbacks, and offline queue replay | Milestone 9 | Accepted |
| [ADR-007](ADR-007-evaluation-metrics-and-learning-loop.md) | Evaluation Metrics & Post-Disaster Learning Loop | Ground truth performance metrics, calibration, and advisory policy recommendations | Milestone 10 | Accepted |
