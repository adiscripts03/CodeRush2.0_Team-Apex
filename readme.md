# Disaster Management Command System

> **DISCLAIMER & PROVENANCE NOTICE**: This system is a **historical simulation and replay tool** based on the extreme Kerala Floods event of August 2018 (Alappuzha and Kottayam districts). It is **NOT** a live real-time monitoring tool.

---

## 🌟 Key Features

1. **Detection & Hazard Replay**
   - Interactive horizontal scrubber driven by historical satellite keyframes (`2018-08-14` onset, `2018-08-15` data gap, `2018-08-17` peak flood).
   - Dynamic **Confidence Indicators** (numeric 0.0–1.0 and visual tags).
   - **Data-Gap Banner Warning** explicitly alerting users when satellite coverage is unavailable and models interpolate growth.

2. **Evacuation Planning & Decision Support (Human-in-the-Loop)**
   - Rule-based decision generator (`src/lib/planGenerator.js`) calculating nearest safe relief shelters with available capacity and routing vectors.
   - **Human-in-the-Loop Framework**: Action cards require explicit commander review with **Approve**, **Edit Directives**, or **Reject** choices. Unapproved recommendations remain strictly labeled as draft directives.

3. **Geospatial Impact Analysis (Turf.js)**
   - Calculates flooded surface area in hectares (matching Dartmouth Flood Observatory benchmarks: 28,737 ha to 50,119 ha peak).
   - Identifies at-risk hospitals and submerged road networks.

4. **Activity Audit Stream**
   - Timestamped log capturing satellite timeline scrubbing, plan generation, human approval actions, and emergency alert dispatches.

5. **Emergency Alert Center**
   - Minimal Express backend endpoint (`POST /api/send-alert`) for transmitting emergency transactional alerts to district response command nodes.

---

## 📊 Data Provenance & Credits

- **Satellite Flood Extents**: Dartmouth Flood Observatory (DFO) / Sentinel-1 SAR observations for Kerala August 2018.
- **Infrastructure (Hospitals, Shelters, Roads, Rivers)**: Sourced from [OpenStreetMap](https://www.openstreetmap.org/) via Overpass API under the Open Database License (ODbL).
- **Synthetic Datasets**: Reservoir levels (`sensor_log.json`) and shelter capacity limits (`shelters_capacity.json`) are synthetic fixtures generated for operational demonstration purposes.

---

## 🛠️ Tech Stack

- Frontend: React, Vite, Tailwind CSS, Leaflet, Recharts
- Spatial analysis: `@turf/turf`, `react-leaflet`
- Backend: Node.js, Express, Nodemailer

## Quickstart

```bash
npm install
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

```bash
npm run build
```

## Data Notes

Flood extents and infrastructure layers are based on historical Kerala 2018 data; reservoir and shelter capacity fixtures are synthetic demo inputs.