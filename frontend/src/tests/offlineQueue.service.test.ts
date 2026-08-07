import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearOfflineQueue,
  enqueueOfflineAction,
  getQueuedOfflineActions,
  syncOfflineQueue
} from "../services/offline-queue.service";

beforeEach(() => {
  clearOfflineQueue();
});

describe("offlineQueue.service", () => {
  it("enqueues offline approval actions into storage", () => {
    enqueueOfflineAction("approve_recommendation", { recommendationId: "REC_101" });
    const queue = getQueuedOfflineActions();

    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("approve_recommendation");
    expect(queue[0].payload.recommendationId).toBe("REC_101");
  });

  it("replays queued actions and clears storage upon successful sync", async () => {
    enqueueOfflineAction("approve_recommendation", { recommendationId: "REC_101" });
    enqueueOfflineAction("reject_recommendation", { recommendationId: "REC_102", rejectionReason: "Duplicate" });

    const mockReplay = vi.fn().mockResolvedValue(undefined);
    const result = await syncOfflineQueue(mockReplay);

    expect(result.processedCount).toBe(2);
    expect(mockReplay).toHaveBeenCalledTimes(2);
    expect(getQueuedOfflineActions()).toHaveLength(0);
  });
});
