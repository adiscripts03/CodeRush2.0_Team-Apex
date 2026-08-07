# ADR-004: 5-Stage Explainable Agentic Decision Planner Loop

## Context

In high-stakes Emergency Operations Center (EOC) environments, autonomous AI agents cannot emit opaque or unconstrained decisions. Every recommendation must be fully explainable, linked to empirical evidence, bounded by resource constraints, and audited before execution.

We needed to decide how to structure the agentic decision planning engine.

## Decision

We decided to implement the **5-Stage Explicit Decision Loop**:

$$\text{Observe} \longrightarrow \text{Estimate} \longrightarrow \text{Explain} \longrightarrow \text{Plan} \longrightarrow \text{Review}$$

### Key Principles:
1. **Empirical Grounding**: Recommendations are generated only after synthesizing data from active observation sensors (NDWI flood extent, river levels, weather) and impact estimation models (population exposure, blocked roads, shelter demand).
2. **Mandatory Explainability Structure**: Every recommendation object MUST contain explicit `reasoning` steps, `evidence` metrics, `confidenceScore`, operational `constraints`, and evaluated `alternatives`.
3. **No Unsanctioned Execution**: Every recommendation is emitted with `status: "proposed"`, requiring human approval in Milestone 8.

## Consequences

- **Pros**:
  - Eliminates black-box AI hallucination risks.
  - Guarantees complete auditability and human-in-the-loop oversight.
  - Seamlessly integrates with preceding and future milestones.
- **Cons**:
  - Rule-based policy heuristics require explicit maintenance as new hazard types are added.

## Status

Accepted and implemented in Milestone 7.
