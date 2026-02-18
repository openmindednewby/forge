import { useState } from "react";
import type { JSX } from "react";

import { Box, HardDrive, Loader2 } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { getModels, loadModel, unloadModel } from "../api/client";
import { isValueDefined } from "../utils/typeGuards";

import type { ModelInfo } from "../api/client";

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const BYTES_PER_GB = BYTES_PER_MB * BYTES_PER_KB;

const formatSize = (bytes: number): string => {
  const gb = bytes / BYTES_PER_GB;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / BYTES_PER_MB;
  return `${mb.toFixed(0)} MB`;
};

const ModelCard = ({
  model,
  isActive,
  isLoading,
  onLoad,
}: {
  model: ModelInfo;
  isActive: boolean;
  isLoading: boolean;
  onLoad: () => void;
}): JSX.Element => (
  <div
    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
      isActive
        ? "border-forge-500/40 bg-forge-500/5"
        : "border-neutral-800 bg-surface-2 hover:bg-surface-3"
    }`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`rounded-lg p-2 ${
          isActive
            ? "bg-forge-500/20 text-forge-400"
            : "bg-surface-4 text-neutral-500"
        }`}
      >
        <HardDrive className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium text-neutral-200">{model.name}</p>
        <p className="text-xs text-neutral-500">
          {model.type} &middot; {formatSize(model.size_bytes)} &middot;{" "}
          {model.filename}
        </p>
      </div>
    </div>

    {isActive ? (
      <span className="rounded-full bg-forge-500/20 px-3 py-1 text-xs font-medium text-forge-400">
        Active
      </span>
    ) : (
      <button
        className="flex items-center gap-1.5 rounded-lg bg-surface-4 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
        disabled={isLoading}
        onClick={onLoad}
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Load
      </button>
    )}
  </div>
);

export const ModelsPage = (): JSX.Element => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["models"],
    queryFn: async () => getModels(),
  });
  const [loadingModel, setLoadingModel] = useState<string | null>(null);

  const handleLoad = async (modelId: string): Promise<void> => {
    setLoadingModel(modelId);
    try {
      await loadModel(modelId);
      await refetch();
    } finally {
      setLoadingModel(null);
    }
  };

  const handleUnload = async (): Promise<void> => {
    await unloadModel();
    await refetch();
  };

  const activeModelText = data?.active_model;
  const hasActiveModel = isValueDefined(activeModelText);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Models</h1>
        {hasActiveModel ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">
              Active:{" "}
              <span className="text-forge-400">{activeModelText}</span>
            </span>
            <button
              className="rounded-lg bg-surface-3 px-3 py-1.5 text-xs text-neutral-400 hover:bg-surface-4"
              onClick={() => {
                handleUnload().catch(() => {
                  // Silently handle unload failures
                });
              }}
            >
              Unload
            </button>
          </div>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-neutral-500">
            Loading models...
          </div>
        ) : null}

        {data?.models.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-neutral-600">
            <Box className="mb-2 h-8 w-8" />
            <p>No models found</p>
            <p className="mt-1 text-sm">
              Place .safetensors files in your models/checkpoints directory
            </p>
          </div>
        )}

        <div className="space-y-2">
          {data?.models.map((model) => (
            <ModelCard
              key={model.id}
              isActive={model.id === data.active_model}
              isLoading={loadingModel === model.id}
              model={model}
              onLoad={() => {
                handleLoad(model.id).catch(() => {
                  // Silently handle load failures
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
