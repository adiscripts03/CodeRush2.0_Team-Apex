# Milestone 3: Historical Replay Engine

## 1. Architecture

Milestone 3 adds a time-aware replay system that allows operators to step through historical flood events, observe how conditions evolved over time, and synchronize map visualizations with snapshot state.

The replay engine is structured around two core data concepts:

- **Replay Timelines**: time-bounded containers representing a historical disaster event, with a defined start, end, and timestep resolution.
- **Replay Snapshots**: discrete state captures within a timeline, each recording weather, river levels, flood extent, road availability, and narrative notes.

All replay interactions are audited through the existing Milestone 1 audit service.

## 2. Why This Milestone Exists

Before the EOC can plan responses, evaluate strategies, or recommend actions, it must be able to faithfully replay what happened. The replay engine creates a time-travel substrate that later planning, approval, and learning milestones will use to evaluate counterfactual decisions.

## 3. How It Integrates

Backend:

- `replay/timeline-engine.ts` provides timestamp math, progress calculation, and closest-snapshot lookup.
- `replay/replay.service.ts` manages timeline and snapshot CRUD with audit event recording.
- `replay/replay.types.ts` defines typed replay event inputs and snapshot state shapes.
- `models/replay-timeline.model.ts` stores timelines with source provenance.
- `models/replay-snapshot.model.ts` stores snapshots with multi-layer state.
- `api/replay.routes.ts` exposes RESTful replay APIs.
- `scripts/import-replay.ts` imports replay JSON files with audit trail.
- `validation/replay.validation.ts` validates all replay API inputs.

Frontend:

- `hooks/useReplayController.ts` manages the full replay lifecycle: loading timelines, syncing snapshots, playback tick, speed control, seeking, and stepping.
- `replay/timestampController.ts` converts between slider values and timestamps.
- `services/replay.service.ts` calls backend replay APIs.
- `components/ReplayControls.tsx` renders play/pause, step forward/backward, speed, and time slider.
- `components/SnapshotPanel.tsx` displays weather, river levels, flood extent summary, and notes.
- `components/EocMap.tsx` renders snapshot flood extent as a dynamic Mapbox layer.

## 4. Folder Structure

```text
backend/
  data/replay/
    kerala-floods-2018.sample.json
  src/
    api/replay.routes.ts
    models/replay-timeline.model.ts
    models/replay-snapshot.model.ts
    replay/
      replay.service.ts
      replay.types.ts
      timeline-engine.ts
    scripts/import-replay.ts
    scripts/import-replay-fixtures.ts
    validation/replay.validation.ts
    tests/
      timeline-engine.test.ts
      replay.integration.test.ts
frontend/
  src/
    components/
      EocMap.tsx           (modified: flood extent layer)
      ReplayControls.tsx   (modified: step controls, 8x speed)
      SnapshotPanel.tsx    (new)
    hooks/
      useReplayController.ts (modified: stepForward, stepBackward)
    pages/
      HomePage.tsx         (modified: replay integration)
    replay/
      replay.types.ts
      timestampController.ts
    services/
      replay.service.ts
    tests/
      timestampController.test.ts
      replayControls.test.tsx
```

## 5. Database Schema

### `replay_timelines`

- `hazardType`: one of `flood`, `wildfire`, `landslide`, `cyclone`, `earthquake`.
- `name`: display name.
- `description`: optional narrative description.
- `startsAt`: timeline start datetime.
- `endsAt`: timeline end datetime.
- `timestepMinutes`: interval between snapshots.
- `source.name`, `source.provider`, `source.license`, `source.checksum`, `source.importedAt`: provenance metadata.

Indexes:

- `{ hazardType: 1, startsAt: 1 }`

### `replay_snapshots`

- `timelineId`: reference to the parent timeline.
- `sequence`: zero-indexed position.
- `timestamp`: absolute datetime for this snapshot.
- `state.floodExtent`: GeoJSON FeatureCollection of flood zones.
- `state.weather`: rainfall and condition data.
- `state.riverLevels`: array of station-level readings with trend.
- `state.roadAvailability`: GeoJSON FeatureCollection of available roads.
- `state.notes`: narrative description.

Indexes:

- unique `{ timelineId: 1, timestamp: 1 }`
- unique `{ timelineId: 1, sequence: 1 }`

## 6. Backend

Implemented APIs:

- `GET /api/replay/timelines` — returns all replay timelines.
- `GET /api/replay/timelines/:timelineId` — returns a single timeline by ID.
- `GET /api/replay/timelines/:timelineId/snapshots` — returns all snapshots for a timeline.
- `GET /api/replay/timelines/:timelineId/snapshots?at=<ISO>` — returns the closest snapshot to the given timestamp.
- `POST /api/replay/events` — accepts a replay audit event.

Implemented import scripts:

```bash
npm run import:replay --workspace backend -- --file data/replay/kerala-floods-2018.sample.json
```

Local fixture import:

```bash
npm run import:replay:fixtures --workspace backend
```

## 7. Frontend

Implemented:

- Replay controls panel with play/pause, step forward/backward, speed (1x/2x/4x/8x), time slider with boundary labels.
- Snapshot state panel showing weather conditions, river levels with trend indicators, flood extent zone count, and narrative notes.
- Map flood extent rendering synchronized with the active snapshot.
- Full audit trail for every replay interaction (play, pause, seek, step, speed change, snapshot load, controller sync).
- Automatic timeline loading on page mount with graceful error handling.

## 8. Tests

Backend:

- Timeline engine unit tests: `assertTimestampInTimeline`, `getTimestampProgress`, `findClosestSnapshot` with edge cases.
- Replay API integration tests: all endpoints, validation errors, 404 handling, audit event creation.

Frontend:

- Timestamp controller unit tests: `getTimelineDurationMs`, `clampTimestamp`, `timestampToSliderValue`, `sliderValueToTimestamp`.
- ReplayControls component render tests: loading, error, playing, paused, buttons, speed options, step controls.
- SnapshotPanel component render tests: loading, empty, weather, river levels, flood zones, notes.

## 9. How To Verify

```bash
npm install
npm run typecheck
npm test
npm run build
```

With MongoDB Atlas configured:

```bash
cp backend/.env.example backend/.env
npm run import:replay:fixtures --workspace backend
npm run dev:backend
npm run dev:frontend
```

Set `VITE_MAPBOX_ACCESS_TOKEN` in `frontend/.env` to render the map with flood extent.

## 10. Acceptance Criteria

- Replay timelines and snapshots are stored in MongoDB.
- Import scripts preserve source metadata and audit the import.
- APIs return timelines, snapshots, and accept replay events.
- Frontend renders replay controls with play/pause/seek/step/speed.
- Frontend displays snapshot state (weather, river levels, flood extent, notes).
- Map renders flood extent from the active snapshot.
- Every replay interaction is audited through the Milestone 1 audit service.
- Timeline engine provides timestamp math and closest-snapshot lookup.
- Unit and integration tests pass.
- No simulation, planner, alerts, evacuation, or approval execution logic is implemented.

## Future Milestone Boundary

Real-time simulation, predictive modeling, planner recommendations, human approval workflows, alert broadcasting, evacuation routing, and learning reports belong to later milestones.
