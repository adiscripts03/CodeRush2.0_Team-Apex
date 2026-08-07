# Hackathon Presentation Demo Script for Judges

## Executive Pitch (30 Seconds)
> "Judges, during the 2018 Kerala Floods, relief commanders faced data overload, telecom outages, and uncoordinated resource routing. We present the **Kerala Floods 2018 Intelligence Engine**—a simulation-first disaster management platform that turns satellite data into explainable agentic decision plans, safe evacuation routes, and human-in-the-loop command execution with immutable audit trails."

---

## 3-Minute Walkthrough Steps

### Step 1: Historical Replay & Satellite Detection (Observe & Estimate)
1. Point to the **Interactive Timeline Replay Controls**. Click **Play** or scrub to **August 15, 2018 06:00 UTC**.
2. Show the **Sentinel-2 Flood Extent Layer** rendering on the **Mapbox map**.
3. Point out the **Flood Analysis Panel**: Explain how NDWI thresholding delineated **35.0 km²** of inundation, while Turf.js spatial change analysis highlights expanding water perimeters in red.

### Step 2: Real-time Impact Assessment & Evacuation Routing
1. Point out the **Impact Assessment Summary Panel**: Highlight **45,200 affected residents**, **14.5 km of submerged highways**, and **9,000 shelter demand**.
2. Click **Generate Evacuation Route** on the **Resource Inventory Panel**: Show how the routing engine automatically calculates safe waypoint bypasses around active flood zones.

### Step 3: Agentic Planner & Human Approval Gate (Plan & Approve)
1. Scroll to the **Agentic Decision Planner Panel**: Show the 5-stage decision trace (Observe $\to$ Estimate $\to$ Explain $\to$ Plan $\to$ Review).
2. Point out the **Human Approval Panel**: Highlight the pending recommendation card to deploy NDRF rescue boats.
3. Click **Approve**: Point out how status transitions from `proposed` $\to$ `approved` $\to$ `executed`, updating the boat fleet capacity to `deployed`.
4. Demonstrate **Mandatory Rejection Reason**: Attempt to reject a recommendation without entering a rationale—show the validation guard stopping invalid rejection.

### Step 4: Resilience Failure Simulator & Offline Queue (Fault Tolerance)
1. Click **+ Comms Outage** on the **System Resilience Panel**: Show the system entering **Degraded Mode** while maintaining operational fallback estimates.
2. Demonstrate **Offline Action Queue**: Show how approval actions are queued locally when disconnected and replayed upon reconnection.

### Step 5: Post-Disaster Evaluation & Learning Loop (Evaluate & Report)
1. Point out the **Evaluation & Learning Panel**: Show the **Ground Truth Verification Grid** (**Flood IoU: 0.84**, **Lead Time: 18.5 hrs**, **100% Route Feasibility**).
2. Expand the **Learning Report**: Show the advisory policy recommendations generated for future disaster preparedness.
