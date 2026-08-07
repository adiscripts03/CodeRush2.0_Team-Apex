import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReplaySnapshot, ReplayTimeline } from "../replay/replay.types";
import { clampTimestamp, sliderValueToTimestamp, timestampToSliderValue } from "../replay/timestampController";
import { auditReplayEvent, fetchReplayTimelines, fetchSnapshotAt } from "../services/replay.service";

interface ReplayControllerState {
  timelines: ReplayTimeline[];
  activeTimeline: ReplayTimeline | null;
  activeTimestampMs: number | null;
  activeSnapshot: ReplaySnapshot | null;
  isPlaying: boolean;
  speed: number;
  sliderValue: number;
  isLoading: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  seek: (sliderValue: number) => void;
  setSpeed: (speed: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
}

const playbackTickMs = 1000;

export function useReplayController(): ReplayControllerState {
  const [timelines, setTimelines] = useState<ReplayTimeline[]>([]);
  const [activeTimeline, setActiveTimeline] = useState<ReplayTimeline | null>(null);
  const [activeTimestampMs, setActiveTimestampMs] = useState<number | null>(null);
  const [activeSnapshot, setActiveSnapshot] = useState<ReplaySnapshot | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchReplayTimelines()
      .then((loadedTimelines) => {
        if (!isMounted) {
          return;
        }

        const firstTimeline = loadedTimelines[0] ?? null;
        setTimelines(loadedTimelines);
        setActiveTimeline(firstTimeline);
        setActiveTimestampMs(firstTimeline ? new Date(firstTimeline.startsAt).getTime() : null);
        setIsLoading(false);

        if (firstTimeline) {
          void auditReplayEvent({
            eventType: "replay.timeline.loaded",
            timelineId: firstTimeline._id,
            timestamp: new Date(firstTimeline.startsAt)
          });
        }
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unknown replay timeline error");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeTimeline || activeTimestampMs === null) {
      return;
    }

    const timestamp = new Date(activeTimestampMs);

    fetchSnapshotAt(activeTimeline._id, timestamp)
      .then((snapshot) => {
        setActiveSnapshot(snapshot);
        return auditReplayEvent({
          eventType: "replay.controller.synced",
          timelineId: activeTimeline._id,
          timestamp,
          payload: { snapshotId: snapshot._id }
        });
      })
      .catch((syncError: unknown) => {
        setError(syncError instanceof Error ? syncError.message : "Unknown replay snapshot error");
      });
  }, [activeTimeline, activeTimestampMs]);

  useEffect(() => {
    if (!activeTimeline || !isPlaying || activeTimestampMs === null) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveTimestampMs((current) => {
        if (current === null) {
          return current;
        }

        const next = clampTimestamp(activeTimeline, current + activeTimeline.timestepMinutes * 60_000 * speed);
        if (next >= new Date(activeTimeline.endsAt).getTime()) {
          setIsPlaying(false);
        }

        return next;
      });
    }, playbackTickMs);

    return () => window.clearInterval(interval);
  }, [activeTimeline, activeTimestampMs, isPlaying, speed]);

  const sliderValue = useMemo(() => {
    if (!activeTimeline || activeTimestampMs === null) {
      return 0;
    }

    return timestampToSliderValue(activeTimeline, activeTimestampMs);
  }, [activeTimeline, activeTimestampMs]);

  const play = useCallback(() => {
    if (!activeTimeline || activeTimestampMs === null) {
      return;
    }

    setIsPlaying(true);
    void auditReplayEvent({
      eventType: "replay.play.started",
      timelineId: activeTimeline._id,
      timestamp: new Date(activeTimestampMs)
    });
  }, [activeTimeline, activeTimestampMs]);

  const pause = useCallback(() => {
    if (!activeTimeline || activeTimestampMs === null) {
      return;
    }

    setIsPlaying(false);
    void auditReplayEvent({
      eventType: "replay.play.paused",
      timelineId: activeTimeline._id,
      timestamp: new Date(activeTimestampMs)
    });
  }, [activeTimeline, activeTimestampMs]);

  const seek = useCallback(
    (value: number) => {
      if (!activeTimeline) {
        return;
      }

      const nextTimestamp = sliderValueToTimestamp(activeTimeline, value);
      setActiveTimestampMs(nextTimestamp);
      void auditReplayEvent({
        eventType: "replay.timestamp.seeked",
        timelineId: activeTimeline._id,
        timestamp: new Date(nextTimestamp),
        payload: { sliderValue: value }
      });
    },
    [activeTimeline]
  );

  const setSpeed = useCallback(
    (nextSpeed: number) => {
      if (!activeTimeline || activeTimestampMs === null) {
        return;
      }

      setSpeedState(nextSpeed);
      void auditReplayEvent({
        eventType: "replay.speed.changed",
        timelineId: activeTimeline._id,
        timestamp: new Date(activeTimestampMs),
        payload: { speed: nextSpeed }
      });
    },
    [activeTimeline, activeTimestampMs]
  );

  const stepForward = useCallback(() => {
    if (!activeTimeline || activeTimestampMs === null) {
      return;
    }

    const stepMs = activeTimeline.timestepMinutes * 60_000;
    const nextTimestamp = clampTimestamp(activeTimeline, activeTimestampMs + stepMs);
    setActiveTimestampMs(nextTimestamp);
    void auditReplayEvent({
      eventType: "replay.timestamp.seeked",
      timelineId: activeTimeline._id,
      timestamp: new Date(nextTimestamp),
      payload: { direction: "forward", stepMs }
    });
  }, [activeTimeline, activeTimestampMs]);

  const stepBackward = useCallback(() => {
    if (!activeTimeline || activeTimestampMs === null) {
      return;
    }

    const stepMs = activeTimeline.timestepMinutes * 60_000;
    const nextTimestamp = clampTimestamp(activeTimeline, activeTimestampMs - stepMs);
    setActiveTimestampMs(nextTimestamp);
    void auditReplayEvent({
      eventType: "replay.timestamp.seeked",
      timelineId: activeTimeline._id,
      timestamp: new Date(nextTimestamp),
      payload: { direction: "backward", stepMs }
    });
  }, [activeTimeline, activeTimestampMs]);

  return {
    timelines,
    activeTimeline,
    activeTimestampMs,
    activeSnapshot,
    isPlaying,
    speed,
    sliderValue,
    isLoading,
    error,
    play,
    pause,
    seek,
    setSpeed,
    stepForward,
    stepBackward
  };
}

