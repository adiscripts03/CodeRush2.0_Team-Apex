import type { QueuedOfflineAction } from "../resilience/resilience.types";

const QUEUE_STORAGE_KEY = "kerala_eoc_offline_queue_v1";

export function getQueuedOfflineActions(): QueuedOfflineAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedOfflineAction[]) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineAction(
  type: "approve_recommendation" | "reject_recommendation",
  payload: Record<string, unknown>
): QueuedOfflineAction {
  const queue = getQueuedOfflineActions();
  const newAction: QueuedOfflineAction = {
    id: `OFFLINE_ACT_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    timestamp: Date.now()
  };

  queue.push(newAction);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // ignore storage quota errors
  }
  return newAction;
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function syncOfflineQueue(
  replayHandler: (action: QueuedOfflineAction) => Promise<void>
): Promise<{ processedCount: number }> {
  const queue = getQueuedOfflineActions();
  if (queue.length === 0) {
    return { processedCount: 0 };
  }

  let processedCount = 0;
  for (const action of queue) {
    try {
      await replayHandler(action);
      processedCount++;
    } catch {
      // stop sync on failure to preserve order
      break;
    }
  }

  // Remove processed items
  const remaining = queue.slice(processedCount);
  try {
    if (remaining.length > 0) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  return { processedCount };
}
