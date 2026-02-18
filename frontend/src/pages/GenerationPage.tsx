import type { JSX } from "react";

import { Sparkles } from "lucide-react";

import { getImageUrl } from "../api/client";
import { useGenerationSubmit } from "../hooks/useGenerationSubmit";
import { useQueueStore } from "../stores/queueStore";
import { isValueDefined } from "../utils/typeGuards";
import { ParamsPanel } from "./generation/ParamsPanel";


const OutputPanel = ({ error }: { error: string | null }): JSX.Element => {
  const jobs = useQueueStore((s) => s.jobs);
  const latestJob = jobs[jobs.length - 1];
  const firstImage = latestJob?.images[0];

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      {isValueDefined(error) ? (
        <div className="mb-4 rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {latestJob?.status === "running" && (
        <div className="flex flex-col items-center gap-4">
          {isValueDefined(latestJob.previewImage) ? (
            <img
              alt="Preview"
              className="max-h-[512px] rounded-lg opacity-70"
              src={`data:image/jpeg;base64,${latestJob.previewImage}`}
            />
          ) : null}
          <div className="w-64">
            <div className="mb-1 flex justify-between text-xs text-neutral-500">
              <span>
                Step {latestJob.step}/{latestJob.totalSteps}
              </span>
              <span>{Math.round(latestJob.progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-forge-500 transition-all duration-300"
                style={{ width: `${String(latestJob.progress)}%` }}
              />
            </div>
          </div>
          <p className="max-w-md truncate text-sm text-neutral-500">
            {latestJob.prompt}
          </p>
        </div>
      )}

      {latestJob?.status === "completed" && latestJob.images.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          {isValueDefined(firstImage) && (
            <img
              alt="Generated"
              className="max-h-[600px] rounded-lg shadow-2xl"
              src={getImageUrl(firstImage.id)}
            />
          )}
          <div className="flex gap-2">
            {latestJob.images.map((img) => (
              <div key={img.id} className="text-xs text-neutral-500">
                {img.width}x{img.height} | Seed: {img.seed}
              </div>
            ))}
          </div>
          {isValueDefined(latestJob.elapsedSeconds) ? (
            <p className="text-xs text-neutral-600">
              Generated in {latestJob.elapsedSeconds.toFixed(1)}s
            </p>
          ) : null}
        </div>
      )}

      {latestJob?.status === "failed" && (
        <div className="text-center">
          <p className="text-red-400">Generation failed</p>
          <p className="mt-1 text-sm text-neutral-500">{latestJob.error}</p>
        </div>
      )}

      {!isValueDefined(latestJob) && (
        <div className="text-center text-neutral-600">
          <Sparkles className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p className="text-lg">Ready to generate</p>
          <p className="mt-1 text-sm">
            Enter a prompt and click Generate to begin
          </p>
        </div>
      )}
    </div>
  );
};

export const GenerationPage = (): JSX.Element => {
  const { submit, isSubmitting, error } = useGenerationSubmit();

  return (
    <div className="flex h-full">
      <ParamsPanel isSubmitting={isSubmitting} onGenerate={submit} />
      <OutputPanel error={error} />
    </div>
  );
};
