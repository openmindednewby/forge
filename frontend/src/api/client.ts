import axios from "axios";

import { isValueDefined } from "../utils/typeGuards";

import type { AxiosResponse } from "axios";

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

const extractData = <T>(r: AxiosResponse<T>): T => r.data;

// API functions
export const generateImage = async (
  params: GenerateRequest,
): Promise<JobResponse> =>
  api.post<JobResponse>("/generate", params).then(extractData);

export const getJob = async (jobId: string): Promise<JobResponse> =>
  api.get<JobResponse>(`/jobs/${jobId}`).then(extractData);

export const cancelJob = async (jobId: string): Promise<JobResponse> =>
  api.post<JobResponse>(`/jobs/${jobId}/cancel`).then(extractData);

export const getModels = async (
  type?: string,
): Promise<ModelListResponse> =>
  api
    .get<ModelListResponse>("/models", {
      params: isValueDefined(type) && type !== "" ? { type } : {},
    })
    .then(extractData);

export const loadModel = async (
  modelId: string,
): Promise<JobResponse> =>
  api
    .post<JobResponse>(`/models/${encodeURIComponent(modelId)}/load`)
    .then(extractData);

export const unloadModel = async (): Promise<JobResponse> =>
  api.post<JobResponse>("/models/unload").then(extractData);

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

export const getGallery = async (
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  favoritesOnly = false,
): Promise<GalleryResponse> =>
  api
    .get<GalleryResponse>("/gallery", {
      params: { page, page_size: pageSize, favorites_only: favoritesOnly },
    })
    .then(extractData);

export const toggleFavorite = async (
  imageId: string,
): Promise<GalleryImage> =>
  api.patch<GalleryImage>(`/gallery/${imageId}/favorite`).then(extractData);

export const getSystemInfo = async (): Promise<SystemInfo> =>
  api.get<SystemInfo>("/system/info").then(extractData);

export const getImageUrl = (imageId: string): string =>
  `/api/gallery/${imageId}/image`;

export const getThumbnailUrl = (imageId: string): string =>
  `/api/gallery/${imageId}/thumbnail`;
