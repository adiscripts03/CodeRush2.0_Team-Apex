# Dataset Provenance Documentation

This document records the data sources, spatial resolutions, acquisition timelines, and processing pipelines utilized in the **Kerala Floods 2018 Intelligence Engine**.

## 1. Sentinel-2 Satellite Imagery (Copernicus Open Access Hub)
- **Source**: European Space Agency (ESA) Copernicus Sentinel-2 MSI (Multi-Spectral Instrument).
- **Spatial Resolution**: 10m (Bands B03 Green, B08 Near-Infrared).
- **Temporal Coverage**: August 1, 2018 – August 25, 2018 (Peak Kerala Flood Event).
- **Processing**:
  - Normalized Difference Water Index (NDWI): $\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}$
  - Thresholding: $\text{NDWI} > 0.15$ converted to GeoJSON polygons via GDAL/Rasterio.
  - Spatial change analysis computed using Turf.js spatial difference engine.

## 2. OpenStreetMap (OSM) Infrastructure Data
- **Source**: Geofabrik Kerala OSM PBF export (August 2018 snapshot).
- **Layer Coverage**:
  - `roads`: Primary highways, secondary arterial roads, bridges (LineString/MultiLineString).
  - `rivers`: Periyar and Chalakudy river baselines (LineString/MultiLineString).
  - `hospitals`: Critical healthcare facilities (Point/Polygon).
  - `shelters`: Relief camps, community halls, stadiums (Point/Polygon).
  - `schools`: Educational institutions serving as secondary shelters (Point/Polygon).

## 3. Kerala State Disaster Management Authority (KSDMA) Census Data
- **Source**: KSDMA 2018 Population Density and District Boundary Maps.
- **Layer Coverage**:
  - `districts`: 14 Kerala district administrative boundaries with population census attributes.
  - `population`: Ward-level population density grid points.

## 4. Storage & Indexing Standard
- **Format**: GeoJSON (WGS84 EPSG:4326).
- **Database Engine**: MongoDB Atlas / Local MongoDB `2dsphere` spatial indexing.
