import { useState } from "react";

import { generateImage } from "../api/client";
import { useGenerationStore } from "../stores/generationStore";
import { useQueueStore } from "../stores/queueStore";

import type { GenerateRequest } from "../api/client";
import type { GenerationParams } from "../stores/generationStore";

const buildRequest = (params: GenerationParams): GenerateRequest => ({
  mode: "txt2img",
  prompt: params.prompt,
  negative_prompt: params.negativePrompt,
  model_id: params.modelId,
  width: params.width,
  height: params.height,
  steps: params.steps,
  cfg_scale: params.cfgScale,
  seed: params.seed,
  sampler: params.sampler,
  batch_size: params.batchSize,
});

interface GenerationSubmitResult {
  submit: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export function useGenerationSubmit(): GenerationSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getParams = useGenerationStore((s) => s.getParams);
  const addJob = useQueueStore((s) => s.addJob);

  const submit = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const params = getParams();
      const job = await generateImage(buildRequest(params));
      addJob(job.id, params.prompt);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit generation";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error };
}
