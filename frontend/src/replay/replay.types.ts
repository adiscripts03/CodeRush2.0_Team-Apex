export interface ReplayTimeline {
  _id: string;
  name: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  timestepMinutes: number;
}

export interface ReplaySnapshot {
  _id: string;
  timelineId: string;
  sequence: number;
  timestamp: string;
  state: {
    floodExtent?: GeoJSON.FeatureCollection;
    weather?: Record<string, unknown>;
    riverLevels?: Array<Record<string, unknown>>;
    roadAvailability?: GeoJSON.FeatureCollection;
    notes?: string;
  };
}

export type ReplayEventType =
  | "replay.timeline.loaded"
  | "replay.play.started"
  | "replay.play.paused"
  | "replay.timestamp.seeked"
  | "replay.speed.changed"
  | "replay.snapshot.loaded"
  | "replay.controller.synced";
