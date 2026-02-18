import { useEffect } from "react";

import { wsManager } from "../api/websocket";
import { useQueueStore } from "../stores/queueStore";

import type { WebSocketEvent } from "../api/websocket";
import type { ProgressUpdate } from "../stores/queueStore";

const buildProgressUpdate = (
  event: Extract<WebSocketEvent, { type: "job:progress" }>,
): ProgressUpdate => ({
  id: event.job_id,
  step: event.step,
  totalSteps: event.total_steps,
  percentage: event.percentage,
  preview: event.preview_image,
});

export function useWebSocket(): void {
  const { startJob, updateJobProgress, completeJob, failJob } =
    useQueueStore();

  useEffect(() => {
    wsManager.connect();

    const unsubscribe = wsManager.subscribe((event: WebSocketEvent) => {
      switch (event.type) {
        case "job:started":
          startJob(event.job_id);
          break;
        case "job:progress":
          updateJobProgress(buildProgressUpdate(event));
          break;
        case "job:completed":
          completeJob(event.job_id, event.images, event.elapsed_seconds);
          break;
        case "job:failed":
          failJob(event.job_id, event.error);
          break;
        default:
          break;
      }
    });

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [startJob, updateJobProgress, completeJob, failJob]);
}
