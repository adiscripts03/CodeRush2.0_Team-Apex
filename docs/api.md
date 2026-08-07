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
