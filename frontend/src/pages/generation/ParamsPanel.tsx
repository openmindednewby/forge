import type { JSX } from "react";

import { Dice5, Loader2, Send } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { getModels } from "../../api/client";
import { useGenerationStore } from "../../stores/generationStore";


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

const SEED_BIT_LENGTH = 32;
const SEED_UPPER_BOUND = 2 ** SEED_BIT_LENGTH;

const SizeSelector = (): JSX.Element => {
  const store = useGenerationStore();
  return (
    <fieldset>
      <legend className="mb-1 block text-xs font-medium text-neutral-400">
        Size
      </legend>
      <div className="grid grid-cols-2 gap-1.5">
        {SIZES.map((s) => (
          <button
            key={s.label}
            className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
              store.width === s.w && store.height === s.h
                ? "bg-forge-500/20 text-forge-400 ring-1 ring-forge-500/40"
                : "bg-surface-3 text-neutral-400 hover:bg-surface-4"
            }`}
            onClick={() => {
              store.setWidth(s.w);
              store.setHeight(s.h);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
};

export const ParamsPanel = ({
  onGenerate,
  isSubmitting,
}: {
  onGenerate: () => void;
  isSubmitting: boolean;
}): JSX.Element => {
  const store = useGenerationStore();
  const { data: modelData } = useQuery({
    queryKey: ["models"],
    queryFn: async () => getModels("checkpoint"),
  });

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    const isCtrlEnter = e.key === "Enter" && (e.ctrlKey || e.metaKey);
    if (isCtrlEnter) onGenerate();
  };

  return (
    <div className="flex w-80 flex-col border-r border-neutral-800 bg-surface-1">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Prompt */}
        <fieldset>
          <label
            className="mb-1 block text-xs font-medium text-neutral-400"
            htmlFor="prompt"
          >
            Prompt
          </label>
          <textarea
            className="h-28 w-full resize-none rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-forge-500 focus:outline-none"
            id="prompt"
            placeholder="A beautiful landscape..."
            value={store.prompt}
            onChange={(e) => store.setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </fieldset>

        {/* Negative prompt */}
        <fieldset>
          <label
            className="mb-1 block text-xs font-medium text-neutral-400"
            htmlFor="negative-prompt"
          >
            Negative Prompt
          </label>
          <textarea
            className="h-16 w-full resize-none rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-forge-500 focus:outline-none"
            id="negative-prompt"
            placeholder="blurry, low quality..."
            value={store.negativePrompt}
            onChange={(e) => store.setNegativePrompt(e.target.value)}
          />
        </fieldset>

        {/* Model */}
        <fieldset>
          <label
            className="mb-1 block text-xs font-medium text-neutral-400"
            htmlFor="model"
          >
            Model
          </label>
          <select
            className="w-full rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100"
            id="model"
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

        <SizeSelector />

        {/* Steps */}
        <fieldset>
          <div className="mb-1 flex items-center justify-between">
            <label
              className="text-xs font-medium text-neutral-400"
              htmlFor="steps"
            >
              Steps
            </label>
            <span className="text-xs text-neutral-500">{store.steps}</span>
          </div>
          <input
            className="w-full accent-forge-500"
            id="steps"
            max={150}
            min={1}
            type="range"
            value={store.steps}
            onChange={(e) => store.setSteps(Number(e.target.value))}
          />
        </fieldset>

        {/* CFG Scale */}
        <fieldset>
          <div className="mb-1 flex items-center justify-between">
            <label
              className="text-xs font-medium text-neutral-400"
              htmlFor="cfg-scale"
            >
              CFG Scale
            </label>
            <span className="text-xs text-neutral-500">{store.cfgScale}</span>
          </div>
          <input
            className="w-full accent-forge-500"
            id="cfg-scale"
            max={30}
            min={1}
            step={0.5}
            type="range"
            value={store.cfgScale}
            onChange={(e) => store.setCfgScale(Number(e.target.value))}
          />
        </fieldset>

        {/* Seed */}
        <fieldset>
          <label
            className="mb-1 block text-xs font-medium text-neutral-400"
            htmlFor="seed"
          >
            Seed
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100"
              id="seed"
              placeholder="-1 for random"
              type="number"
              value={store.seed}
              onChange={(e) => store.setSeed(Number(e.target.value))}
            />
            <button
              aria-label="Random seed"
              className="rounded-lg bg-surface-3 p-2 text-neutral-400 hover:bg-surface-4 hover:text-neutral-200"
              title="Random seed"
              onClick={() =>
                store.setSeed(Math.floor(Math.random() * SEED_UPPER_BOUND))
              }
            >
              <Dice5 className="h-4 w-4" />
            </button>
          </div>
        </fieldset>

        {/* Sampler */}
        <fieldset>
          <label
            className="mb-1 block text-xs font-medium text-neutral-400"
            htmlFor="sampler"
          >
            Sampler
          </label>
          <select
            className="w-full rounded-lg border border-neutral-700 bg-surface-2 px-3 py-2 text-sm text-neutral-100"
            id="sampler"
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-forge-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-forge-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || store.prompt.trim() === ""}
          onClick={onGenerate}
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
};
