# ADR-007: Evaluation Metrics & Post-Disaster Learning Loop

## Context

To measure system performance and facilitate continuous improvement after disaster events, we needed a standardized evaluation framework comparing AI predictions against ground truth Kerala 2018 flood data.

We also needed to ensure that post-disaster learning reports produce advisory policy recommendations for human decision-makers rather than self-modifying live system code without oversight.

## Decision

We decided to:
1. Implement a 9-metric evaluation suite (Flood IoU, Precision, Recall, Lead Time, False Alarm Rate, Population Error, Route Feasibility, Resource Utilization, Planner Feasibility).
2. Generate structured post-disaster learning reports containing confidence calibration curves and policy improvement recommendations.
3. Enforce that learning loop output is strictly advisory—producing recommendations for future human policy review without automatically mutating production code logic.

## Consequences

- **Pros**:
  - Provides empirical verification of AI prediction accuracy.
  - Ensures system safety by maintaining human control over policy updates.
  - Exposes confidence calibration to measure model uncertainty accuracy.
- **Cons**:
  - Requires offline human review to act on policy recommendations.

## Status

Accepted and implemented in Milestone 10.
