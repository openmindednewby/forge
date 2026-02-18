import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// Types matching backend schemas
export interface GenerateRequest {
  mode?: string;
  prompt: string;
  negative_prompt?: string;
  model_id?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  sampler?: string;
  batch_size?: number;
}

export interface GeneratedImageInfo {
  id: string;
  file_path: string;
  thumbnail_path: string;
  width: number;
  height: number;
  seed: number;
}

export interface JobResponse {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  mode: string;
  prompt: string;
  negative_prompt: string;
  model_id: string;
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  seed: number;
  sampler: string;
  images: GeneratedImageInfo[];
  error_message: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  filename: string;
  type: string;
  size_bytes: number;
}

export interface ModelListResponse {
  models: ModelInfo[];
  active_model: string | null;
}

export interface GalleryImage {
  id: string;
  job_id: string;
  file_path: string;
  thumbnail_path: string;
  width: number;
  height: number;
  seed: number;
  prompt: string;
  negative_prompt: string;
  model_id: string;
  is_favorite: boolean;
  created_at: string;
}

export interface GalleryResponse {
  images: GalleryImage[];
  total: number;
  page: number;
  page_size: number;
}

export interface SystemInfo {
  version: string;
  backend: string;
  gpu: {
    name: string;
    vram_total_mb: number;
    vram_used_mb: number;
    vram_free_mb: number;
    cuda_version: string;
  };
  models_loaded: string[];
  queue_length: number;
  python_version: string;
}

// API functions
export const generateImage = (params: GenerateRequest) =>
  api.post<JobResponse>("/generate", params).then((r) => r.data);

export const getJob = (jobId: string) =>
  api.get<JobResponse>(`/jobs/${jobId}`).then((r) => r.data);

export const cancelJob = (jobId: string) =>
  api.post(`/jobs/${jobId}/cancel`).then((r) => r.data);

export const getModels = (type?: string) =>
  api
    .get<ModelListResponse>("/models", { params: type ? { type } : {} })
    .then((r) => r.data);

export const loadModel = (modelId: string) =>
  api.post(`/models/${encodeURIComponent(modelId)}/load`).then((r) => r.data);

export const unloadModel = () =>
  api.post("/models/unload").then((r) => r.data);

export const getGallery = (page = 1, pageSize = 50, favoritesOnly = false) =>
  api
    .get<GalleryResponse>("/gallery", {
      params: { page, page_size: pageSize, favorites_only: favoritesOnly },
    })
    .then((r) => r.data);

export const toggleFavorite = (imageId: string) =>
  api.patch(`/gallery/${imageId}/favorite`).then((r) => r.data);

export const getSystemInfo = () =>
  api.get<SystemInfo>("/system/info").then((r) => r.data);

export const getImageUrl = (imageId: string) => `/api/gallery/${imageId}/image`;
export const getThumbnailUrl = (imageId: string) =>
  `/api/gallery/${imageId}/thumbnail`;
