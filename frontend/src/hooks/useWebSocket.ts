import { useEffect } from "react";
import type { WebSocketEvent } from "../api/websocket";
import { wsManager } from "../api/websocket";
import { useQueueStore } from "../stores/queueStore";

export function useWebSocket() {
  const { startJob, updateJobProgress, completeJob, failJob } = useQueueStore();

  useEffect(() => {
    wsManager.connect();

    const unsubscribe = wsManager.subscribe((event: WebSocketEvent) => {
      switch (event.type) {
        case "job:started":
          startJob(event.job_id);
          break;
        case "job:progress":
          updateJobProgress(
            event.job_id,
            event.step,
            event.total_steps,
            event.percentage,
            event.preview_image,
          );
          break;
        case "job:completed":
          completeJob(event.job_id, event.images, event.elapsed_seconds);
          break;
        case "job:failed":
          failJob(event.job_id, event.error);
          break;
      }
    });

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [startJob, updateJobProgress, completeJob, failJob]);
}
