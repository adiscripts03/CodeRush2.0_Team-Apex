# Architecture Diagrams

## 1. End-to-End 8-Stage Decision Loop

```mermaid
flowchart TD
    subgraph Stage1["1. OBSERVE"]
        A1[Sentinel-2 Satellite Imagery] --> A2[MongoDB GeoJSON Store]
        A2 --> A3[Mapbox Visualizer & Replay Controller]
    end

    subgraph Stage2["2. ESTIMATE"]
        A3 --> B1[NDWI Spatial Change Engine]
        B1 --> B2[Impact Calculator]
        B2 --> B3[Affected Pop, Roads, Hospitals, Shelters]
    end

    subgraph Stage3["3. EXPLAIN UNCERTAINTY"]
        B3 --> C1[Confidence Scoring & Reasoning Traces]
        C1 --> C2[Evidence & Counterfactuals]
    end

    subgraph Stage4["4. PLAN WITHIN CONSTRAINTS"]
        C2 --> D1[Agentic Decision Loop Engine]
        D1 --> D2[Generate 6 Recommendation Action Types]
    end

    subgraph Stage5["5. HUMAN APPROVAL"]
        D2 --> E1[Human Command Approval Gate]
        E1 -->|Approve| E2[Execute Side-Effects]
        E1 -->|Reject| E3[Validate Mandatory Rejection Reason]
    end

    subgraph Stage6["6. SIMULATED EXECUTION"]
        E2 --> F1[Update Resource Fleet & Shelter Capacities]
        F1 --> F2[Emit Immutable Audit Event Log]
    end

    subgraph Stage7["7. EVALUATE"]
        F2 --> G1[Ground Truth Evaluation Engine]
        G1 --> G2[Compute Flood IoU, Precision, Recall, Lead Time]
    end

    subgraph Stage8["8. LEARNING REPORT"]
        G2 --> H1[Post-Disaster Learning Report Generator]
        H1 --> H2[Advisory Policy Recommendations]
    end
```

## 2. System Architecture Component Diagram

```mermaid
componentDiagram
    [React + Mapbox Dashboard] --> [Express REST API Layer]
    [Express REST API Layer] --> [Replay Engine]
    [Express REST API Layer] --> [Flood Intelligence Engine]
    [Express REST API Layer] --> [Impact Assessment Engine]
    [Express REST API Layer] --> [Evacuation Routing Engine]
    [Express REST API Layer] --> [Agentic Planner Loop Engine]
    [Express REST API Layer] --> [Human Approval & Audit Service]
    [Express REST API Layer] --> [Failure Simulator & Degraded Estimator]
    [Express REST API Layer] --> [Evaluation & Learning Loop Engine]
    
    [Express REST API Layer] --> [MongoDB Atlas / 2dsphere Store]
```
