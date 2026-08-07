# Milestone 4: Flood Detection & Change Detection Engine

## 1. Goal

Build the core flood intelligence engine that detects flood extent from historical Sentinel-2 data (NDWI formula), stores spatial GeoJSON flood polygons in MongoDB, and tracks flood dynamics (expansion vs recession) across consecutive snapshots over time.

## 2. Features Implemented

- **Sentinel-2 Imagery NDWI Ingestion**: Accepts Band 3 (Green) and Band 8 (NIR) surface reflectance data to compute Normalized Difference Water Index ($\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}$).
- **Raster-to-Vector Polygon Extraction**: Converts NDWI threshold grid cells ($\text{NDWI} > 0.3$) into validated GeoJSON polygon geometries.
- **Confidence Calculation**: Scores detection confidence (0 to 1) based on NDWI margin above threshold and cloud cover fraction.
- **MongoDB GeoJSON Storage**: Persists `FloodPolygon` (with `2dsphere` spatial index), `FloodSnapshot`, and `DetectionResult` models.
- **Spatial Change Detection Engine**: Compares consecutive snapshots to compute:
  - Expansion Area ($\text{Polygon}(T_n) \setminus \text{Polygon}(T_{n-1})$)
  - Recession Area ($\text{Polygon}(T_{n-1}) \setminus \text{Polygon}(T_n)$)
  - Persisted Active Area ($\text{Polygon}(T_n) \cap \text{Polygon}(T_{n-1})$)
  - Expansion rate ($\text{km}^2/\text{hr}$) and net area change ($\Delta A$).
- **Mapbox Visualizer**: Visualizes active flood extent along with interactive expansion (red/rose overlay) and recession (emerald green overlay) map layers.

## 3. Database Schema

### `flood_polygons`
- `snapshotId`: ObjectId reference to `FloodSnapshot`.
- `timestamp`: Datetime.
- `geometry`: GeoJSON `Polygon` / `MultiPolygon` with `2dsphere` index.
- `properties`: `{ areaKm2: number, confidence: number, meanNdwi: number, sensorType: string }`.
- `checksum`: SHA-256 geometry hash.

### `flood_snapshots`
- `timestamp`: Datetime (unique index).
- `sourceImageId`: Sentinel-2 source identifier.
- `totalAreaKm2`: Aggregated flood area in $\text{km}^2$.
- `polygonCount`: Number of detected flood polygons.
- `confidenceScore`: Overall detection confidence (0 to 1).
- `status`: `processed` | `pending` | `failed`.

### `detection_results`
- `timestamp`: Datetime.
- `algorithm`: `NDWI_SENTINEL_2`.
- `parameters`: `{ threshold: number, bandGreen: string, bandNir: string }`.
- `confidenceScore`: Confidence score.
- `processedAt`: Audit timestamp.

## 4. API Reference

- `GET /flood/current` (and `/api/flood/current`) — Returns latest flood snapshot metadata & GeoJSON FeatureCollection of flood polygons.
- `GET /flood/history` (and `/api/flood/history`) — Returns list of all flood detection snapshots.
- `POST /flood/detect` (and `/api/flood/detect`) — Runs NDWI detection on band grid cells, stores snapshot/polygons, returns `DetectionResult`.
- `GET /flood/change/:timestamp` (and `/api/flood/change/:timestamp`) — Returns change detection metrics (expanded area, receded area, expansion rate) and spatial FeatureCollections comparing target timestamp to prior snapshot.

## 5. Tests

Backend:
- `ndwi.engine.test.ts` — NDWI formula, thresholding, polygon ring closure, confidence bounds.
- `change-detection.test.ts` — Timestamp ordering, spatial expansion/recession vector difference math.
- `flood.integration.test.ts` — Full integration tests for `/current`, `/history`, `/detect`, and `/change/:timestamp`.

Frontend:
- `floodAnalysisPanel.test.tsx` — Render tests for NDWI metrics, confidence pill, and change metrics.

## 6. Architecture Decision Record (ADR)
See [ADR-001-ndwi-flood-detection.md](file:///d:/Coding/CodeRush2.0_Team-Apex/docs/adr/ADR-001-ndwi-flood-detection.md).

## 7. Technical Debt
- Contour polygon extraction currently uses square bounding boxes per water cell grid. High-resolution continuous raster polygonizer (e.g. GDAL polygonize binding) can be added for sub-meter smoothing.

## 8. Prerequisites for Milestone 5 (Impact Assessment Engine)
- Milestone 4 exposes spatial GeoJSON flood polygons via `GET /flood/current` and `GET /flood/change/:timestamp` with `2dsphere` indexes in `flood_polygons`, ready to intersect with population, road, hospital, and shelter layers in Milestone 5.
