export type ReplayEventType =
  | "replay.timeline.loaded"
  | "replay.play.started"
  | "replay.play.paused"
  | "replay.timestamp.seeked"
  | "replay.speed.changed"
  | "replay.snapshot.loaded"
  | "replay.controller.synced";

export interface ReplayEventInput {
  eventType: ReplayEventType;
  timelineId: string;
  timestamp?: Date;
  actorId?: string;
  payload?: Record<string, unknown>;
}

export interface SnapshotState {
  floodExtent?: GeoJSON.FeatureCollection;
  weather?: Record<string, unknown>;
  riverLevels?: Array<Record<string, unknown>>;
  roadAvailability?: GeoJSON.FeatureCollection;
  notes?: string;
}
