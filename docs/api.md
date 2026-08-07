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

