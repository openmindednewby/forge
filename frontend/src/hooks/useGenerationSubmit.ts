import { useState } from "react";
import { generateImage } from "../api/client";
import type { GenerateRequest } from "../api/client";
import { useGenerationStore } from "../stores/generationStore";
import { useQueueStore } from "../stores/queueStore";

export function useGenerationSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getParams = useGenerationStore((s) => s.getParams);
  const addJob = useQueueStore((s) => s.addJob);

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const params = getParams();
      const request: GenerateRequest = {
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
      };

      const job = await generateImage(request);
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
