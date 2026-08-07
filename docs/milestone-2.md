# Milestone 2: GIS Layer

## 1. Architecture

Milestone 2 adds the GIS substrate used by future flood replay and planning milestones.

All operational map layers are normalized into one MongoDB collection, `gis_features`, using GeoJSON geometries and a `2dsphere` index. Layer-specific behavior lives in import metadata, properties, and frontend Mapbox styling, not in separate collections.

Layers implemented:

- `district_boundary`
- `road`
- `river`
- `hospital`
- `shelter`
- `population`

## 2. Why This Milestone Exists

The EOC needs a reliable shared operating picture before simulation can begin. Districts, roads, rivers, hospitals, shelters, and population are the base layers that later flood extent, route availability, resource planning, and exposure analysis will depend on.

## 3. How It Integrates

Backend:

- `gis/gis.service.ts` imports GeoJSON and serves geospatial queries.
- `models/gis-feature.model.ts` stores every GIS feature with source metadata.
- `scripts/import-gis.ts` imports any GeoJSON FeatureCollection.
- `api/gis.routes.ts` exposes Mapbox-ready GeoJSON and query endpoints.

Frontend:

- `components/EocMap.tsx` renders all GIS layers in Mapbox.
- `gis/layerStyles.ts` defines reusable layer styling.
- `services/gis.service.ts` fetches backend GeoJSON.

Future flood simulation will read the same GIS APIs and models. It does not need to change the GIS foundation.

## 4. Folder Structure

```text
backend/
  data/kerala/
  src/
    api/gis.routes.ts
    gis/
    models/gis-feature.model.ts
    scripts/import-gis.ts
    scripts/import-gis-fixtures.ts
    validation/gis.validation.ts
frontend/
  src/
    components/EocMap.tsx
    gis/
    hooks/useGisLayers.ts
    services/gis.service.ts
```

## 5. Database Schema

### `gis_features`

- `layer`: one of the six supported GIS layer types.
- `name`: display/search name.
- `externalId`: stable id from the source dataset or generated import position.
- `geometry`: GeoJSON geometry.
- `properties`: original source attributes.
- `source`: dataset provenance.
- `createdAt`, `updatedAt`: import timestamps.

Indexes:

- `{ geometry: "2dsphere" }`
- `{ layer: 1, name: 1 }`
- unique `{ layer: 1, externalId: 1 }`
- `{ "source.checksum": 1 }`

Every import emits an audit event: `gis.import.completed`.

## 6. Backend

Implemented APIs:

- `GET /api/gis/layers`
- `GET /api/gis/layers/:layer/features`
- `GET /api/gis/nearby?lng=76.28&lat=9.98&radiusMeters=5000&layers=hospital,shelter`
- `GET /api/gis/intersect?bbox=76.2,9.8,76.3,10.0&layers=district_boundary`

Implemented import scripts:

```bash
npm run import:gis --workspace backend -- \
  --file data/kerala/hospitals.geojson \
  --layer hospital \
  --source-name "Kerala hospitals" \
  --provider "OpenStreetMap" \
  --license "ODbL" \
  --source-url "https://www.openstreetmap.org/copyright"
```

Local fixture import:

```bash
npm run import:gis:fixtures --workspace backend
```

## 7. Frontend

Implemented:

- Mapbox GL map centered on Kerala.
- GeoJSON source and layer creation for every GIS layer.
- Layer summary panel backed by `GET /api/gis/layers`.
- Graceful missing-token state.

## 8. Tests

Backend:

- GeoJSON parser unit tests.
- GIS API integration tests with MongoDB `2dsphere` indexes.
- Nearby and bbox geospatial query tests.

Frontend:

- Mapbox layer style unit tests for all GIS layer types.

## 9. How To Verify

```bash
npm install
npm run typecheck
npm test
npm run build
```

With MongoDB Atlas configured:

```bash
cp backend/.env.example backend/.env
npm run import:gis:fixtures --workspace backend
npm run dev:backend
npm run dev:frontend
```

Set `VITE_MAPBOX_ACCESS_TOKEN` in `frontend/.env` to render the map.

## 10. Acceptance Criteria

- All six GIS layer types are represented in the backend.
- GeoJSON is stored in MongoDB with a `2dsphere` index.
- Import scripts preserve source metadata and audit the import.
- APIs return layer summaries, Mapbox-ready GeoJSON, nearby features, and bbox intersections.
- Frontend renders all layers through Mapbox sources and layers.
- Unit and integration tests pass.
- No simulation, planner, alerts, evacuation, or approval execution logic is implemented.

## Dataset Source Strategy

The repository includes small deterministic fixtures for local development and tests. Production-scale imports should use full exported GeoJSON from traceable providers.

Recommended sources:

- District boundaries: Open Data Kerala district boundary GeoJSON derived from OpenStreetMap.
- Roads, rivers, hospitals, shelters: OpenStreetMap exports with ODbL attribution.
- Population: Census 2011 district or gridded population datasets converted to GeoJSON.

Every imported file must be recorded with provider, license, source URL, checksum, and import audit event.

## Future Milestone Boundary

Flood extents, timestep replay, road closure state, river level observations, exposure estimates, routing, planner recommendations, and approval workflows belong to later milestones.
