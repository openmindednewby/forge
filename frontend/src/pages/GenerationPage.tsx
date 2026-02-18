import { useQuery } from "@tanstack/react-query";
import { Dice5, Loader2, Send, Sparkles } from "lucide-react";
import { getImageUrl, getModels } from "../api/client";
import { useGenerationSubmit } from "../hooks/useGenerationSubmit";
import { useGenerationStore } from "../stores/generationStore";
import { useQueueStore } from "../stores/queueStore";

const SAMPLERS = [
  { value: "euler_a", label: "Euler Ancestral" },
  { value: "euler", label: "Euler" },
  { value: "dpm++_2m", label: "DPM++ 2M" },
  { value: "dpm++_2m_karras", label: "DPM++ 2M Karras" },
];

const SIZES = [
  { w: 512, h: 512, label: "512x512" },
  { w: 768, h: 768, label: "768x768" },
  { w: 512, h: 768, label: "512x768" },
  { w: 768, h: 512, label: "768x512" },
  { w: 1024, h: 1024, label: "1024x1024" },
  { w: 832, h: 1216, label: "832x1216 (SDXL)" },
  { w: 1216, h: 832, label: "1216x832 (SDXL)" },
];

export function GenerationPage() {
  const { submit, isSubmitting, error } = useGenerationSubmit();

  return (
    <div className="flex h-full">
      <ParamsPanel onGenerate={submit} isSubmitting={isSubmitting} />
      <OutputPanel error={error} />
    </div>
  );
}

function ParamsPanel({
  onGenerate,
  isSubmitting,
}: {
  onGenerate: () => void;
  isSubmitting: boolean;
}) {
  const store = useGenerationStore();
  const { data: modelData } = useQuery({
    queryKey: ["models"],
    queryFn: () => getModels("checkpoint"),
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      onGenerate();
    }
  };

  return (
    <div className="flex w-80 flex-col border-r border-neutral-800 bg-surface-1">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Prompt */}
        <fieldset>
          <label htmlFor="prompt" className="mb-1 block text-xs font-medium text-neutral-400">
            Prompt
          </label>
          <textarea
            id="prompt"
            className="h-28 w-full resize-none rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-forge-500 focus:outline-none"
            placeholder="A beautiful landscape..."
            value={store.prompt}
            onChange={(e) => store.setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </fieldset>

        {/* Negative prompt */}
        <fieldset>
          <label htmlFor="negative-prompt" className="mb-1 block text-xs font-medium text-neutral-400">
            Negative Prompt
          </label>
          <textarea
            id="negative-prompt"
            className="h-16 w-full resize-none rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-forge-500 focus:outline-none"
            placeholder="blurry, low quality..."
            value={store.negativePrompt}
            onChange={(e) => store.setNegativePrompt(e.target.value)}
          />
        </fieldset>

        {/* Model */}
        <fieldset>
          <label htmlFor="model" className="mb-1 block text-xs font-medium text-neutral-400">
            Model
          </label>
          <select
            id="model"
            className="w-full rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100"
            value={store.modelId}
            onChange={(e) => store.setModelId(e.target.value)}
          >
            <option value="">Auto-detect</option>
            {modelData?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Size */}
        <fieldset>
          <label className="mb-1 block text-xs font-medium text-neutral-400">
            Size
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {SIZES.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  store.setWidth(s.w);
                  store.setHeight(s.h);
                }}
                className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                  store.width === s.w && store.height === s.h
                    ? "bg-forge-500/20 text-forge-400 ring-1 ring-forge-500/40"
                    : "bg-surface-3 text-neutral-400 hover:bg-surface-4"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Steps */}
        <fieldset>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="steps" className="text-xs font-medium text-neutral-400">
              Steps
            </label>
            <span className="text-xs text-neutral-500">{store.steps}</span>
          </div>
          <input
            id="steps"
            type="range"
            min={1}
            max={150}
            value={store.steps}
            onChange={(e) => store.setSteps(Number(e.target.value))}
            className="w-full accent-forge-500"
          />
        </fieldset>

        {/* CFG Scale */}
        <fieldset>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="cfg-scale" className="text-xs font-medium text-neutral-400">
              CFG Scale
            </label>
            <span className="text-xs text-neutral-500">{store.cfgScale}</span>
          </div>
          <input
            id="cfg-scale"
            type="range"
            min={1}
            max={30}
            step={0.5}
            value={store.cfgScale}
            onChange={(e) => store.setCfgScale(Number(e.target.value))}
            className="w-full accent-forge-500"
          />
        </fieldset>

        {/* Seed */}
        <fieldset>
          <label htmlFor="seed" className="mb-1 block text-xs font-medium text-neutral-400">
            Seed
          </label>
          <div className="flex gap-2">
            <input
              id="seed"
              type="number"
              value={store.seed}
              onChange={(e) => store.setSeed(Number(e.target.value))}
              className="flex-1 rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100"
              placeholder="-1 for random"
            />
            <button
              onClick={() =>
                store.setSeed(Math.floor(Math.random() * 2 ** 32))
              }
              className="rounded-lg bg-surface-3 p-2 text-neutral-400 hover:bg-surface-4 hover:text-neutral-200"
              title="Random seed"
              aria-label="Random seed"
            >
              <Dice5 className="h-4 w-4" />
            </button>
          </div>
        </fieldset>

        {/* Sampler */}
        <fieldset>
          <label htmlFor="sampler" className="mb-1 block text-xs font-medium text-neutral-400">
            Sampler
          </label>
          <select
            id="sampler"
            className="w-full rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100"
            value={store.sampler}
            onChange={(e) => store.setSampler(e.target.value)}
          >
            {SAMPLERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      {/* Generate button */}
      <div className="border-t border-neutral-800 p-4">
        <button
          onClick={onGenerate}
          disabled={isSubmitting || !store.prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-forge-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-forge-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          Generate
        </button>
        <p className="mt-1 text-center text-[10px] text-neutral-600">
          Ctrl+Enter to generate
        </p>
      </div>
    </div>
  );
}

function OutputPanel({ error }: { error: string | null }) {
  const jobs = useQueueStore((s) => s.jobs);
  const latestJob = jobs[jobs.length - 1];

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {latestJob?.status === "running" && (
        <div className="flex flex-col items-center gap-4">
          {latestJob.previewImage && (
            <img
              src={`data:image/jpeg;base64,${latestJob.previewImage}`}
              alt="Preview"
              className="max-h-[512px] rounded-lg opacity-70"
            />
          )}
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
                style={{ width: `${latestJob.progress}%` }}
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
          <img
            src={getImageUrl(latestJob.images[0]!.id)}
            alt="Generated"
            className="max-h-[600px] rounded-lg shadow-2xl"
          />
          <div className="flex gap-2">
            {latestJob.images.map((img) => (
              <div
                key={img.id}
                className="text-xs text-neutral-500"
              >
                {img.width}x{img.height} | Seed: {img.seed}
              </div>
            ))}
          </div>
          {latestJob.elapsedSeconds && (
            <p className="text-xs text-neutral-600">
              Generated in {latestJob.elapsedSeconds.toFixed(1)}s
            </p>
          )}
        </div>
      )}

      {latestJob?.status === "failed" && (
        <div className="text-center">
          <p className="text-red-400">Generation failed</p>
          <p className="mt-1 text-sm text-neutral-500">{latestJob.error}</p>
        </div>
      )}

      {!latestJob && (
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
}

