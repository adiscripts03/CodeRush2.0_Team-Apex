# API Design

## `GET /health`

Returns service status and dependency state.

Response:

```json
{
  "service": "kerala-floods-eoc-backend",
  "status": "ok",
  "timestamp": "2026-08-07T00:00:00.000Z",
  "dependencies": {
    "mongo": {
      "status": "disconnected"
    }
  }
}
```

`status` is `ok` when the API process is healthy. MongoDB status is reported independently so local development and tests can run without Atlas.

## `GET /api/hazards`

Returns registered hazard modules.

Response:

```json
{
  "hazards": [
    {
      "type": "flood",
      "displayName": "Flood",
      "version": "0.1.0",
      "enabled": true
    }
  ]
}
```

## `GET /api/gis/layers`

Returns imported GIS layer counts.

## `GET /api/gis/layers/:layer/features`

Returns a GeoJSON FeatureCollection for a single layer.

Supported layers:

- `district_boundary`
- `road`
- `river`
- `hospital`
- `shelter`
- `population`

## `GET /api/gis/nearby`

Finds features near a point using MongoDB geospatial indexes.

Query params:

- `lng`
- `lat`
- `radiusMeters`
- `layers`, optional comma-separated layer list

## `GET /api/gis/intersect`

Finds features intersecting a bounding box.

Query params:

- `bbox`: `minLng,minLat,maxLng,maxLat`
- `layers`, optional comma-separated layer list

## `GET /api/replay/timelines`

Returns all replay timelines sorted by start time.

Response:

```json
{
  "timelines": [
    {
      "_id": "...",
      "hazardType": "flood",
      "name": "Kerala Floods 2018 Sample Replay",
      "description": "...",
      "startsAt": "2018-08-15T00:00:00.000Z",
      "endsAt": "2018-08-15T12:00:00.000Z",
      "timestepMinutes": 360,
      "source": { "name": "...", "provider": "...", "license": "...", "checksum": "...", "importedAt": "..." }
    }
  ]
}
```

## `GET /api/replay/timelines/:timelineId`

Returns a single replay timeline by ID.

Returns 404 with code `REPLAY_TIMELINE_NOT_FOUND` if the timeline does not exist.

## `GET /api/replay/timelines/:timelineId/snapshots`

Returns all snapshots for a timeline sorted by timestamp.

Optional query param:

- `at`: ISO 8601 datetime string. When provided, returns the single closest snapshot to the given timestamp instead of the full list.

Response (without `at`):

```json
{
  "snapshots": [
    {
      "_id": "...",
      "timelineId": "...",
      "sequence": 0,
      "timestamp": "2018-08-15T00:00:00.000Z",
      "state": {
        "weather": { "rainfallMm": 92, "condition": "heavy_rain" },
        "riverLevels": [{ "station": "Periyar sample", "levelMeters": 3.8, "trend": "rising" }],
        "notes": "Initial state.",
        "floodExtent": { "type": "FeatureCollection", "features": [] }
      }
    }
  ]
}
```

Response (with `at`): returns a single snapshot object (not wrapped in an array).

## `POST /api/replay/events`

Records a replay audit event.

Request body:

```json
{
  "eventType": "replay.play.started",
  "timelineId": "000000000000000000000001",
  "timestamp": "2018-08-15T06:00:00.000Z",
  "actorId": "operator-1",
  "payload": { "speed": 2 }
}
```

Valid event types:

- `replay.timeline.loaded`
- `replay.play.started`
- `replay.play.paused`
- `replay.timestamp.seeked`
- `replay.speed.changed`
- `replay.snapshot.loaded`
- `replay.controller.synced`

Response: `202 Accepted` with `{ "accepted": true }`.

## `GET /flood/current` (alias `/api/flood/current`)

Returns current detected flood extent snapshot and GeoJSON FeatureCollection.

## `GET /flood/history` (alias `/api/flood/history`)

Returns list of all historical flood detection snapshots.

## `POST /flood/detect` (alias `/api/flood/detect`)

Executes NDWI flood detection on Sentinel-2 surface reflectance band grid cells and stores flood polygons.

Request body:

```json
{
  "timestamp": "2018-08-15T06:00:00.000Z",
  "sourceImageId": "SENTINEL2_20180815_KERALA",
  "threshold": 0.3,
  "cloudCoverFraction": 0.05,
  "cells": [
    { "lng": 76.25, "lat": 9.95, "green": 0.5, "nir": 0.1 }
  ]
}
```

Response: `201 Created` with `DetectionResult`.

## `GET /flood/change/:timestamp` (alias `/api/flood/change/:timestamp`)

Returns spatial change analysis (expanded, receded, persisted area, expansion rate) comparing target timestamp to prior snapshot.

## `GET /impact/:timestamp` (alias `/api/impact/:timestamp`)

Returns full impact assessment for a given timestamp, including affected population, blocked road count/length, affected hospitals/shelters/schools, shelter demand estimate, and severity score.

## `GET /impact/summary` (alias `/api/impact/summary`)

Returns latest impact assessment summary.

## `GET /impact/population` (alias `/api/impact/population`)

Returns district-level affected population exposure breakdowns.

Query params:
- `timestamp`: Optional ISO 8601 datetime string.

## `GET /resources` (alias `/api/resources`)

Returns all emergency resources, vehicles, and shelter capacity statuses.

## `POST /resources/update` (alias `/api/resources/update`)

Updates resource quantity, vehicle status, or shelter occupancy.

Request body:

```json
{
  "shelterId": "SHELTER_ERNAKULAM_TOWN_HALL",
  "occupancy": 900
}
```

## `GET /routes/evacuation` (alias `/api/routes/evacuation`)

Calculates evacuation route to nearest available shelter with capacity, bypassing active flood polygons.

Query params:
- `lng`: Origin longitude.
- `lat`: Origin latitude.
- `evacueesCount`: Optional evacuees count (default: 50).

## `GET /routes/safe` (alias `/api/routes/safe`)

Calculates safe point-to-point route bypassing active flood polygons.

Query params:
- `origLng`: Origin longitude.
- `origLat`: Origin latitude.
- `destLng`: Destination longitude.
- `destLat`: Destination latitude.

## `POST /planner/run` (alias `/api/planner/run`)

Executes the 5-stage decision loop (Observe -> Estimate -> Explain -> Plan -> Review) and generates evidence-backed recommendations.

Request body:

```json
{
  "timestamp": "2018-08-15T06:00:00.000Z"
}
```

Response: `200 OK` with `DecisionLoopRunOutput`.

## `GET /planner/recommendations` (alias `/api/planner/recommendations`)

Returns list of active recommendations.

Query params:
- `timestamp`: Optional ISO 8601 datetime string.

## `GET /planner/explanation/:id` (alias `/api/planner/explanation/:id`)

Returns detailed reasoning trace, evidence, and decision loop explanation for a recommendation ID.

## `GET /approvals` (alias `/api/approvals`)

Returns list of pending and history recommendations and human approval records.

Query params:
- `status`: Optional status string (`proposed`, `approved`, `rejected`, `executed`).

## `POST /approvals/approve` (alias `/api/approvals/approve` and `POST /approvals/:id/approve`)

Approves a recommendation and triggers action execution side-effects.

Request body:

```json
{
  "recommendationId": "REC_SHELTER_1534312800000",
  "approvedBy": "Commander Sarah",
  "rationale": "Urgent shelter opening required"
}
```

## `POST /approvals/reject` (alias `/api/approvals/reject` and `POST /approvals/:id/reject`)

Rejects a recommendation with mandatory rejection reason.

Request body:

```json
{
  "recommendationId": "REC_SHELTER_1534312800000",
  "rejectedBy": "Commander Sarah",
  "rejectionReason": "Sufficient capacity exists in adjacent shelter"
}
```

## `GET /audit/timeline` (alias `/api/audit/timeline`)

Returns chronologically sorted list of audit event entries.

Query params:
- `limit`: Optional number (default: 50).
- `eventType`: Optional event type filter.
- `startDate`: Optional ISO 8601 datetime string.
- `endDate`: Optional ISO 8601 datetime string.






