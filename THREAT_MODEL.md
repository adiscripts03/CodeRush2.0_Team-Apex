# Threat Model: Team Apex Disaster Command System

This document outlines the operational and technical threats specific to the Disaster Management Command System, addressing vulnerabilities in data inputs, system availability, and sensitive information exposure.

## 1. False Alarms (Resource Misallocation & Unnecessary Evacuation Orders)
**Threat:** The system generates a high-priority evacuation order based on a false positive from a satellite keyframe or a faulty sensor (e.g., a gauge reading 110% capacity when it is actually empty). 
**Impact:** Unnecessary panic, evacuation fatigue (cry-wolf effect), and critical emergency resources (e.g., NDRF boats) being dispatched to dry areas, leaving genuinely flooded areas without support.
**Current Mitigations:**
- **Human-in-the-loop Gate:** The `planGenerator.js` logic only creates *draft* recommendations. No dispatch or alert is sent until a human commander explicitly reviews and clicks "Approve".
- **Confidence Scoring:** Satellite keyframes feature explicit confidence metrics (e.g., `< 0.5` flags as "Reduced Confidence").
**Needed Mitigations:**
- Multi-sensor consensus requirements before generating a "CRITICAL" priority plan (e.g., satellite + ground sensor must both agree).

## 2. Missed Events / False Negatives (Undetected Hazard Growth)
**Threat:** A rapid flood event or dam breach occurs during a "Data Gap" (e.g., heavy cloud cover prevents satellite imagery, or a 12-hour gap between satellite passes). The system continues to show "Normal" conditions.
**Impact:** Delayed response, failure to evacuate at-risk hospitals/shelters in time, leading to potential loss of life.
**Current Mitigations:**
- **Data Gap Banner:** The system visually alerts commanders when the current timeline keyframe is an interpolation or is missing data (`data_gap: true`), warning them not to trust the visual absence of a hazard.
- **Degraded Confidence UI:** Degraded imagery is distinctly labeled to lower commander reliance on visual tools during gaps.
**Needed Mitigations:**
- Integrating predictive hydrodynamic models (like HEC-RAS) to simulate gap-fill scenarios automatically based on rainfall upstream, rather than relying solely on the last-known satellite pass.

## 3. Outages (API Downtime & Connectivity Loss)
**Threat:** The command center loses internet connectivity due to the disaster destroying local telecom infrastructure, or the backend APIs (OpenAI for agentic planning, or SMTP for alerts) go down.
**Impact:** Complete paralysis of the command center; inability to generate response plans, view sensor data, or dispatch alerts to field units.
**Current Mitigations:**
- **Offline / Low-Bandwidth Mode:** The application features a simulated offline state where outbound emergency alerts are queued locally and synchronized (flushed) once connectivity is restored.
**Needed Mitigations:**
- Local fallback models: Deploying a small, quantized LLM (e.g., Llama-3-8B) locally on command center hardware to replace OpenAI API calls if the network fails.
- PWA (Progressive Web App) service workers to aggressively cache all GeoJSON layers and base tiles.

## 4. Sensitive Location Data Exposure
**Threat:** Precise geospatial data regarding vulnerable populations, exact shelter capacities, or critical infrastructure is intercepted or accessed by unauthorized actors.
**Impact:** Malicious actors could exploit vulnerabilities (e.g., looting evacuated areas, targeting crowded, under-resourced shelters).
**Current Mitigations:**
- None strictly enforced on the frontend data layer (currently serving static `.geojson` files directly).
**Needed Mitigations:**
- **Role-Based Access Control (RBAC):** Ensure that only authenticated "Commander" roles can see precise shelter capacities and hospital vulnerability scores. 
- **Data Fuzzing:** Public-facing or lower-clearance views should only see aggregated hex-bin data rather than precise point-coordinates for sensitive facilities.
