import { create } from "zustand";
import type { GeneratedImageInfo } from "../api/client";

interface QueueJob {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  prompt: string;
  progress: number;
  step: number;
  totalSteps: number;
  previewImage: string | null;
  images: GeneratedImageInfo[];
  error: string | null;
  elapsedSeconds: number | null;
}

interface QueueState {
  jobs: QueueJob[];
  activeJobId: string | null;
  addJob: (id: string, prompt: string) => void;
  updateJobProgress: (
    id: string,
    step: number,
    totalSteps: number,
    percentage: number,
    preview: string | null,
  ) => void;
  completeJob: (
    id: string,
    images: GeneratedImageInfo[],
    elapsed: number,
  ) => void;
  failJob: (id: string, error: string) => void;
  startJob: (id: string) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
}

// Expose store for E2E testing in development mode
declare global {
  interface Window {
    __FORGE_QUEUE_STORE__?: typeof useQueueStore;
  }
}

export const useQueueStore = create<QueueState>((set) => ({
  jobs: [],
  activeJobId: null,

  addJob: (id, prompt) =>
    set((state) => ({
      jobs: [
        ...state.jobs,
        {
          id,
          status: "queued",
          prompt,
          progress: 0,
          step: 0,
          totalSteps: 0,
          previewImage: null,
          images: [],
          error: null,
          elapsedSeconds: null,
        },
      ],
    })),

  startJob: (id) =>
    set((state) => ({
      activeJobId: id,
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, status: "running" as const } : j,
      ),
    })),

  updateJobProgress: (id, step, totalSteps, percentage, preview) =>
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? {
              ...j,
              step,
              totalSteps,
              progress: percentage,
              previewImage: preview ?? j.previewImage,
            }
          : j,
      ),
    })),

  completeJob: (id, images, elapsed) =>
    set((state) => ({
      activeJobId: state.activeJobId === id ? null : state.activeJobId,
      jobs: state.jobs.map((j) =>
        j.id === id
          ? {
              ...j,
              status: "completed" as const,
              progress: 100,
              images,
              elapsedSeconds: elapsed,
            }
          : j,
      ),
    })),

  failJob: (id, error) =>
    set((state) => ({
      activeJobId: state.activeJobId === id ? null : state.activeJobId,
      jobs: state.jobs.map((j) =>
        j.id === id
          ? { ...j, status: "failed" as const, error }
          : j,
      ),
    })),

  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== id),
    })),

  clearCompleted: () =>
    set((state) => ({
      jobs: state.jobs.filter(
        (j) => j.status !== "completed" && j.status !== "failed",
      ),
    })),
}));

// Expose for E2E tests in development
if (import.meta.env.DEV) {
  window.__FORGE_QUEUE_STORE__ = useQueueStore;
}
