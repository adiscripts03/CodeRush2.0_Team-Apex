# Milestone 7: Agentic Decision Planner Engine

## 1. Goal

Implement the **Agentic Decision Planner Engine**, the centerpiece of the Emergency Operations Center. The planner executes the 5-stage decision loop ($\text{Observe} \to \text{Estimate} \to \text{Explain} \to \text{Plan} \to \text{Review}$), synthesizing data from all preceding milestones to generate evidence-backed, constraint-bounded action recommendations.

## 2. Features Implemented

- **5-Stage Decision Loop**:
  1. **Observe**: Ingests flood extent, weather, river levels, GIS layers.
  2. **Estimate**: Evaluates exposed population, blocked roads, shelter demand.
  3. **Explain**: Formulates uncertainty factors (cloud cover, fleet availability).
  4. **Plan**: Evaluates rule-based policy heuristics to generate 6 action recommendations.
  5. **Review**: Establishes human approval gates and review criteria.
- **6 Action Recommendation Types**:
  - `open_shelter`: Triggered when shelter demand exceeds open capacity.
  - `deploy_rescue_boats`: Triggered when flood area $> 10 \text{ km}^2$ and boat fleet is available.
  - `close_road`: Triggered when road segments intersect active flood extent.
  - `send_medical_team`: Triggered when hospitals/shelters face operational risk.
  - `prioritize_district`: Triggered to rank high-impact districts by exposure.
  - `schedule_review`: Schedules periodic 6-hour re-evaluation.
- **Explainability & Traceability**: Every recommendation includes step-by-step reasoning, linked metric evidence, confidence score (0-1), operational constraints, and evaluated alternatives.
- **Duplicate Prevention & Constraint Satisfaction**: Deduplicates actions by target ID and enforces fleet/capacity limits.
- **Decision Planner Dashboard Panel**: Frontend UI rendering the 5-stage stepper, action cards, priority badges (`critical`, `high`, `medium`), and reasoning/evidence accordions.

## 3. Database Schema

### `plan_recommendations`
- `recommendationId`: Unique recommendation identifier.
- `timestamp`: Datetime.
- `actionType`: `open_shelter` | `deploy_rescue_boats` | `close_road` | `send_medical_team` | `prioritize_district` | `schedule_review`.
- `targetName`: Target entity display name.
- `targetId`: Target entity identifier.
- `priority`: `low` | `medium` | `high` | `critical`.
- `reasoning`: Array of chain-of-thought logic strings.
- `evidence`: Array of `{ metric, value, source }`.
- `confidenceScore`: Confidence score (0.0 to 1.0).
- `constraints`: Operational constraint limits.
- `alternatives`: Evaluated alternative actions and trade-offs.
- `status`: `proposed` | `approved` | `rejected` | `executed`.

### `planner_explanations`
- `recommendationId`: Reference to `PlanRecommendation`.
- `timestamp`: Datetime.
- `observeSummary`: Summary of observation step.
- `estimateSummary`: Summary of impact estimation step.
- `explainUncertainty`: `{ confidence, factors }`.
- `planSummary`: Summary of planning stage.
- `reviewCriteria`: Human approval gate criteria.

## 4. API Reference

- `POST /planner/run` (and `/api/planner/run`) — Runs full 5-stage decision loop and generates recommendations.
- `GET /planner/recommendations` (and `/api/planner/recommendations`) — Returns list of active recommendations.
- `GET /planner/explanation/:id` (and `/api/planner/explanation/:id`) — Returns detailed reasoning trace, evidence, and decision explanation for a recommendation ID.

## 5. Tests

Backend:
- `recommendation-generator.test.ts` — Recommendation policy rules, duplicate prevention, constraint checks, evidence linking.
- `decision-loop.engine.test.ts` — 5-stage loop execution, uncertainty factor detection.
- `planner.integration.test.ts` — Integration tests for `/planner/run`, `/planner/recommendations`, and `/planner/explanation/:id`.

Frontend:
- `plannerDecisionPanel.test.tsx` — Component render tests for decision loop stepper, recommendation cards, and reasoning accordions.

## 6. Architecture Decision Record (ADR)
See [ADR-004-agentic-decision-planner-loop.md](file:///d:/Coding/CodeRush2.0_Team-Apex/docs/adr/ADR-004-agentic-decision-planner-loop.md).

## 7. Technical Debt
- Rule-based policy heuristics generate deterministic action recommendations. Integration with fine-tuned domain LLMs can be added in future iterations while preserving the mandatory JSON schema constraint structure.

## 8. Prerequisites for Milestone 8 (Human Approval Workflow & Audit Trail)
- Milestone 7 outputs recommendations with `status: "proposed"`. Milestone 8 will build the Human Approval Workflow (`GET /approvals`, `POST /approvals/:id`) and immutable audit trail to transition recommendations from `proposed` $\to$ `approved` / `rejected`.
