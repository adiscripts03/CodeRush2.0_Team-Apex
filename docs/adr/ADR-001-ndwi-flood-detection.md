# ADR-001: Vector-Based NDWI Flood Detection & Change Detection Engine

## Context

The Emergency Operations Center (EOC) requires real-time detection of flood extent from Sentinel-2 optical imagery and spatial change tracking (expansion vs. recession) between consecutive disaster timeline timesteps.

We needed to decide between:
1. Storing raw raster geotiff files and serving WMS/WMTS image tiles to Mapbox.
2. Extracting vector GeoJSON flood polygons via NDWI thresholding, storing them in MongoDB with `2dsphere` indexes, and performing vector polygon difference math for change detection using Turf.js.

## Decision

We chose **Option 2: Vector GeoJSON Extraction & Spatial Geometry Difference Engine**.

### Rationale:
- **Spatial Queries & Downstream Impact Assessment**: Downstream EOC engines (Milestone 5 Impact Assessment, Milestone 6 Evacuation Routing, Milestone 7 Agentic Planner) need to perform spatial intersections (`$geoIntersects`, Turf `intersect`) against roads, hospitals, shelters, and population points. GeoJSON polygons in MongoDB enable instant spatial queries.
- **Topological Change Math**: Performing vector set operations ($\text{Expansion} = T_n \setminus T_{n-1}$, $\text{Recession} = T_{n-1} \setminus T_n$) produces exact expansion/recession polygon features that can be rendered directly on Mapbox GL JS with distinct visual styles (red for expansion, green for recession).
- **NDWI Standard**: Sentinel-2 Normalized Difference Water Index ($\text{NDWI} = \frac{\text{B03} - \text{B08}}{\text{B03} + \text{B08}}$) provides accurate open water extraction with minimal computational overhead.

## Consequences

- **Pros**:
  - Direct integration with Mapbox GL JS GeoJSON sources.
  - Native spatial indexing in MongoDB (`2dsphere`).
  - High performance for change detection and impact intersection queries.
- **Cons**:
  - Extremely detailed complex rasters must be simplified into GeoJSON rings to keep payload sizes manageable.

## Status

Accepted and implemented in Milestone 4.
