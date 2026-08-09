🏆 HACKATHON ACHIEVEMENT

🥈 1ST RUNNER-UP — CODERUSH 2.0

Team Apex ! proudly secured the 🥈 1st Runner-Up position at CodeRush 2.0, organized by Yeshwantrao Chavan College of Engineering (YCCE), Nagpur.

Project Name - Suraksha Setu

Team Name - Team Apex! 

Team Leader - Aditya Singh

🚨 ABOUT SURAKSHA SETU

Suraksha Setu is a Disaster Management & Response Platform designed to help authorities efficiently issue emergency alerts, coordinate evacuations, manage disaster response, and support affected communities during recovery and rehabilitation.

The project focuses on building a faster, safer, and more coordinated disaster-response ecosystem, bridging the gap between authorities and citizens during critical situations.

## 🌟 Key Features

1. **Real-Time Detection & Hazard Tracking**
   - Interactive horizontal scrubber driven by satellite keyframes (capturing event onset, data gaps, and peak hazard footprints).
   - Dynamic **Confidence Indicators** (numeric 0.0–1.0 and visual tags).
   - **Data-Gap Banner Warning** explicitly alerting users when satellite coverage is unavailable and models interpolate growth.

2. **Evacuation Planning & Decision Support (Human-in-the-Loop)**
   - Rule-based decision generator (`src/lib/planGenerator.js`) calculating nearest safe relief shelters with available capacity and routing vectors.
   - **Human-in-the-Loop Framework**: Action cards require explicit commander review with **Approve**, **Edit Directives**, or **Reject** choices. Unapproved recommendations remain strictly labeled as draft directives.

3. **Geospatial Impact Analysis (Turf.js)**
   - Calculates flooded surface area in hectares.
   - Identifies at-risk hospitals and submerged road networks.

4. **Activity Audit Stream**
   - Timestamped log capturing satellite timeline scrubbing, plan generation, human approval actions, and emergency alert dispatches.

5. **Emergency Alert Center**
   - Minimal Express backend endpoint (`POST /api/send-alert`) for transmitting emergency transactional alerts to district response command nodes.

---

## 📊 Data Provenance & Credits

- **Satellite Flood Extents**: Dartmouth Flood Observatory (DFO) / Sentinel-1 SAR observations.
- **Infrastructure (Hospitals, Shelters, Roads, Rivers)**: Sourced from [OpenStreetMap](https://www.openstreetmap.org/) via Overpass API under the Open Database License (ODbL).
- **Operational Datasets**: Reservoir levels (`sensor_log.json`) and shelter capacity limits (`shelters_capacity.json`) are integrated data feeds for live operational deployment.

---

## 🛠️ Tech Stack

- **Frontend**: React (v18), Vite, Tailwind CSS, Lucide Icons, Recharts
- **Geospatial & Mapping**: Leaflet, `react-leaflet`, `@turf/turf`
- **Backend**: Node.js, Express, Nodemailer

---

## 🚀 Quickstart & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Project (Frontend + Express Backend)
```bash
npm run dev:all
```
- **Frontend App**: `http://localhost:5173`
- **Express Backend API**: `http://localhost:3001`

### 3. Build Production Bundle
```bash
npm run build
```

### 4. Deploy to Vercel + Render
See [DEPLOYMENT.md](DEPLOYMENT.md) for the full hosting walkthrough.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    USER["Emergency Commander"]

    subgraph FRONTEND["React + Vite Command Interface"]
        CC["Command Centre"]
        MAP["Command Map"]
        RP["Response Planner"]
        AC["Alert Centre"]
        AL["Activity Log"]
        TS["Timeline Scrubber"]
    end

    subgraph DATA["Historical & Operational Data"]
        SAT["Historical Satellite Flood Extents"]
        INFRA["Infrastructure GeoJSON<br/>Hospitals / Shelters / Roads / Rivers"]
        SENSOR["Synthetic Sensor Data"]
        CAP["Shelter Capacity Data"]
        TIMELINE["Event Timeline"]
    end

    subgraph ENGINE["Decision & Analysis Layer"]
        IMPACT["Turf.js Impact Analysis"]
        PLAN["Rule-Based Plan Generator"]
        CONF["Confidence / Data-Gap Logic"]
        AUDIT["Activity Logger"]
    end

    subgraph BACKEND["Express Backend"]
        API["POST /api/send-alert"]
        MAIL["Transactional Alert Service"]
    end

    USER --> CC
    USER --> MAP
    USER --> RP
    USER --> AC
    USER --> AL

    TS --> TIMELINE
    TIMELINE --> CONF
    SAT --> MAP
    SAT --> CONF

    INFRA --> MAP
    INFRA --> IMPACT
    SENSOR --> IMPACT
    CAP --> PLAN
    INFRA --> PLAN
    IMPACT --> PLAN

    CONF --> CC
    IMPACT --> CC
    PLAN --> RP

    RP --> AUDIT
    TS --> AUDIT
    AC --> API
    API --> MAIL

    AUDIT --> AL
```

---

## 🔄 End-to-End Disaster Response Workflow

```mermaid
flowchart TD
    START["Disaster Event"] --> DATA["Load Data"]

    DATA --> SAT["Satellite Flood Extent"]
    DATA --> INFRA["Infrastructure Data"]
    DATA --> SENSOR["Sensor / Reservoir Data"]
    DATA --> SHELTER["Shelter Capacity Data"]

    SAT --> TIME["Timeline Scrubber"]

    TIME --> CHECK{"Satellite Data Available?"}

    CHECK -->|Yes| FLOOD["Display Observed Flood Extent"]
    CHECK -->|No| GAP["Display Data-Gap Warning"]

    GAP --> INTERP["Interpolate Flood Growth"]
    INTERP --> CONF["Lower Confidence"]

    FLOOD --> CONF2["Calculate Confidence"]

    CONF --> IMPACT["Geospatial Impact Analysis"]
    CONF2 --> IMPACT

    IMPACT --> AREA["Flooded Area"]
    IMPACT --> HOSP["At-Risk Hospitals"]
    IMPACT --> ROADS["Affected Roads"]

    AREA --> PLAN["Generate Response Plan"]
    HOSP --> PLAN
    ROADS --> PLAN
    SHELTER --> PLAN

    PLAN --> ROUTE["Find Suitable Shelters<br/>and Routing Options"]

    ROUTE --> REVIEW{"Commander Review"}

    REVIEW -->|Edit| EDIT["Edit Directives"]
    EDIT --> REVIEW

    REVIEW -->|Reject| REJECT["Reject Recommendation"]
    REVIEW -->|Approve| APPROVE["Approve Directive"]

    APPROVE --> ALERT["Emergency Alert"]
    ALERT --> API["Express Alert API"]
    API --> DISPATCH["Dispatch to Response Node"]

    REJECT --> LOG["Audit Activity"]
    DISPATCH --> LOG
    REVIEW --> LOG
    TIME --> LOG

    LOG --> ACTIVITY["Activity Audit Stream"]
```

---

## 👤 Human-in-the-Loop Decision Workflow

```mermaid
flowchart LR
    DATA["Flood + Infrastructure<br/>Data"]

    DATA --> ANALYSIS["Impact Analysis"]
    ANALYSIS --> ENGINE["Rule-Based<br/>Decision Generator"]

    ENGINE --> DRAFT["Draft Response Directive"]

    DRAFT --> REVIEW["Emergency Commander"]

    REVIEW --> DECISION{"Commander Decision"}

    DECISION -->|Approve| APPROVED["Approved Directive"]
    DECISION -->|Edit| EDIT["Edit Directive"]
    DECISION -->|Reject| REJECTED["Rejected Directive"]

    EDIT --> REVIEW

    APPROVED --> ALERT["Dispatch Emergency Alert"]
    REJECTED --> AUDIT["Audit Log"]
    ALERT --> AUDIT

    DRAFT -.->|"Never automatically executed"| ALERT
```

---

## 📡 Hazard Replay

```mermaid
sequenceDiagram
    actor Commander
    participant UI as Timeline Scrubber
    participant Data as Historical Dataset
    participant Analysis as Impact Analysis
    participant Map as Command Map
    participant Audit as Activity Logger

    Commander->>UI: Select historical date
    UI->>Data: Request keyframe

    alt Satellite data available
        Data-->>UI: Observed flood extent
        UI->>Analysis: Calculate impact
        Analysis-->>Map: Flood extent + affected assets
        Map-->>Commander: Display observed conditions
    else Data gap
        Data-->>UI: No satellite coverage
        UI-->>Commander: Show data-gap warning
        UI->>Analysis: Interpolate flood growth
        Analysis-->>Map: Estimated conditions
        Map-->>Commander: Display lower-confidence estimate
    end

    UI->>Audit: Record timeline interaction
    Analysis->>Audit: Record analysis result
```

## 📁 Directory Structure

```
.
├── public/data/
│   ├── hospitals.geojson          # Named hospitals in Alappuzha/Kottayam
│   ├── shelters.geojson           # Schools & community centres
│   ├── roads.geojson              # Highway & secondary road network
│   ├── rivers.geojson             # Waterways & river vectors
│   ├── flood_20180814.geojson     # Aug 14 satellite flood extent
│   ├── flood_20180817.geojson     # Aug 17 peak flood extent
│   ├── event_timeline.json        # Keyframe scrubber dataset
│   ├── sensor_log.json            # Hydro gauge & dam capacity feed
│   └── shelters_capacity.json     # Capacity metrics & facility specs
├── src/
│   ├── components/
│   │   ├── ActivityFeedItem.jsx
│   │   ├── AlertComposer.jsx
│   │   ├── ConfidenceBadge.jsx
│   │   ├── DataGapBanner.jsx
│   │   ├── LayerToggle.jsx
│   │   ├── MapView.jsx
│   │   ├── Navbar.jsx
│   │   ├── PlanCard.jsx
│   │   └── TimelineScrubber.jsx
│   ├── lib/
│   │   ├── activityLogger.js      # Shared audit logger context & hook
│   │   ├── impactEstimate.js      # Turf.js spatial analysis
│   │   └── planGenerator.js       # Decision support algorithm
│   ├── pages/
│   │   ├── ActivityLog.jsx
│   │   ├── AlertCentre.jsx
│   │   ├── CommandCentre.jsx
│   │   ├── CommandMap.jsx
│   │   └── ResponsePlanner.jsx
│   ├── state/
│   │   └── AppContext.jsx          # Global application state
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── index.js                   # Express server entry point
│   ├── routes/sendAlert.js        # POST /api/send-alert handler
│   └── .env.example
├── package.json
└── README.md
```
