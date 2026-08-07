# Milestone 8: Human Approval Workflow & Audit Trail Engine

## 1. Goal

Build the **Human Approval Workflow & Audit Trail Engine** to provide human commander oversight over AI planner recommendations and establish an immutable, traceable audit trail for all disaster decision loop events, approvals, rejections, and execution side-effects.

## 2. Features Implemented

- **Human Command Oversight**: No AI recommendation is executed automatically. Every recommendation starts in `proposed` status and requires explicit human commander approval or rejection.
- **Mandatory Rejection Rationale**: Rejections are rejected at the API level if a non-empty `rejectionReason` is not provided, ensuring full accountability.
- **Action Execution Triggers**: Approving a recommendation transitions its state `proposed` $\to$ `approved` $\to$ `executed` and triggers domain state updates:
  - `open_shelter`: Updates target shelter status to `open`.
  - `deploy_rescue_boats`: Updates rescue boat fleet status to `deployed`.
  - `send_medical_team`: Updates medical team status to `deployed`.
- **Immutable Audit Trail**: Logs `approval.granted`, `approval.rejected`, and `recommendation.executed` audit events with actor ID, correlation ID, timestamp, and payload.
- **Approval & Audit Dashboard**: Frontend UI rendering pending recommendation cards with Approve/Reject actions, a mandatory rejection drawer, decision history, and a chronological audit timeline viewer.

## 3. Database Schema

### `human_approvals`
- `decisionRecordId`: Reference to `DecisionRecord`.
- `status`: `requested` | `approved` | `rejected` | `expired`.
- `requestedBy`: Display string.
- `approvedBy`: Operator ID or display name.
- `rationale`: Approval rationale or mandatory rejection reason.
- `decidedAt`: Datetime.

### `audit_events`
- `eventId`: Unique event ID.
- `timestamp`: Datetime.
- `eventType`: `approval.granted` | `approval.rejected` | `recommendation.executed` | `planner.run.completed` | `resource.updated`.
- `actorType`: `user` | `system`.
- `actorId`: Actor identifier.
- `correlationId`: Trace correlation identifier.
- `hazardType`: `flood`.
- `payload`: Event metadata payload.

## 4. API Reference

- `GET /approvals` (and `/api/approvals`) — Returns pending and historical approvals lists.
- `POST /approvals/approve` (and `/api/approvals/approve`, `/approvals/:id/approve`) — Approves a recommendation and triggers action execution.
- `POST /approvals/reject` (and `/api/approvals/reject`, `/approvals/:id/reject`) — Rejects a recommendation with mandatory reason.
- `GET /audit/timeline` (and `/api/audit/timeline`) — Returns chronological audit trail events list.

## 5. Tests

Backend:
- `approval.service.test.ts` — Approval state transitions, execution side-effects, mandatory rejection reason validation, audit logging.
- `audit-timeline.service.test.ts` — Audit timeline query filtering and chronological sorting.
- `approval.integration.test.ts` — Integration tests for `/approvals`, `/approvals/approve`, `/approvals/reject`, and `/audit/timeline`.

Frontend:
- `humanApprovalPanel.test.tsx` — Component render tests for pending cards, rejection drawer, decision history, and audit timeline.

## 6. Architecture Decision Record (ADR)
See [ADR-005-human-approval-governance-audit-trail.md](file:///d:/Coding/CodeRush2.0_Team-Apex/docs/adr/ADR-005-human-approval-governance-audit-trail.md).

## 7. Technical Debt
- Single-role approval model. Future iterations can implement multi-signature role-based authorization (e.g., dual Commander + Logistics Officer sign-off for heavy asset deployment).

## 8. Prerequisites for Milestone 9 (Resilience, Failure Simulation & Offline Mode)
- Milestone 8 establishes audit trail integrity. Milestone 9 will build failure simulation (simulating communication tower outages, sensor data loss) and offline mode persistence.
