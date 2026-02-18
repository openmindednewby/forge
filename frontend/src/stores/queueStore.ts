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

export interface ProgressUpdate {
  id: string;
  step: number;
  totalSteps: number;
  percentage: number;
  preview: string | null;
}

interface QueueState {
  jobs: QueueJob[];
  activeJobId: string | null;
  addJob: (id: string, prompt: string) => void;
  updateJobProgress: (update: ProgressUpdate) => void;
  completeJob: (id: string, images: GeneratedImageInfo[], elapsed: number) => void;
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

const FULL_PROGRESS = 100;

const createNewJob = (id: string, prompt: string): QueueJob => ({
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
});

const applyProgress = (job: QueueJob, u: ProgressUpdate): QueueJob => ({
  ...job,
  step: u.step,
  totalSteps: u.totalSteps,
  progress: u.percentage,
  previewImage: u.preview ?? job.previewImage,
});

const markCompleted = (
  job: QueueJob,
  images: GeneratedImageInfo[],
  elapsed: number,
): QueueJob => ({
  ...job,
  status: "completed",
  progress: FULL_PROGRESS,
  images,
  elapsedSeconds: elapsed,
});

const markFailed = (job: QueueJob, error: string): QueueJob => ({
  ...job,
  status: "failed",
  error,
});

const markRunning = (job: QueueJob): QueueJob => ({
  ...job,
  status: "running",
});

const clearActiveId = (
  activeId: string | null,
  targetId: string,
): string | null => (activeId === targetId ? null : activeId);

const mapJob = (
  jobs: QueueJob[],
  id: string,
  transform: (job: QueueJob) => QueueJob,
): QueueJob[] => jobs.map((j) => (j.id === id ? transform(j) : j));

const isTerminal = (job: QueueJob): boolean =>
  job.status === "completed" || job.status === "failed";

export const useQueueStore = create<QueueState>((set) => ({
  jobs: [],
  activeJobId: null,
  addJob: (id, prompt) =>
    set((s) => ({ jobs: [...s.jobs, createNewJob(id, prompt)] })),
  startJob: (id) =>
    set((s) => ({ activeJobId: id, jobs: mapJob(s.jobs, id, markRunning) })),
  updateJobProgress: (u) =>
    set((s) => ({ jobs: mapJob(s.jobs, u.id, (j) => applyProgress(j, u)) })),
  completeJob: (id, images, elapsed) =>
    set((s) => ({
      activeJobId: clearActiveId(s.activeJobId, id),
      jobs: mapJob(s.jobs, id, (j) => markCompleted(j, images, elapsed)),
    })),
  failJob: (id, error) =>
    set((s) => ({
      activeJobId: clearActiveId(s.activeJobId, id),
      jobs: mapJob(s.jobs, id, (j) => markFailed(j, error)),
    })),
  removeJob: (id) =>
    set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
  clearCompleted: () =>
    set((s) => ({ jobs: s.jobs.filter((j) => !isTerminal(j)) })),
}));

// Expose for E2E tests in development
if (import.meta.env.DEV)
  window.__FORGE_QUEUE_STORE__ = useQueueStore;
