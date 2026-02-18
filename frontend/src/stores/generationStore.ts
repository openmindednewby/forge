import { create } from "zustand";

export interface GenerationParams {
  prompt: string;
  negativePrompt: string;
  modelId: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  seed: number;
  sampler: string;
  batchSize: number;
}

interface GenerationState extends GenerationParams {
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (negativePrompt: string) => void;
  setModelId: (modelId: string) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setSteps: (steps: number) => void;
  setCfgScale: (cfgScale: number) => void;
  setSeed: (seed: number) => void;
  setSampler: (sampler: string) => void;
  setBatchSize: (batchSize: number) => void;
  getParams: () => GenerationParams;
  reset: () => void;
}

const defaults: GenerationParams = {
  prompt: "",
  negativePrompt: "",
  modelId: "",
  width: 512,
  height: 512,
  steps: 30,
  cfgScale: 7,
  seed: -1,
  sampler: "euler_a",
  batchSize: 1,
};

export const useGenerationStore = create<GenerationState>((set, get) => ({
  ...defaults,
  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setModelId: (modelId) => set({ modelId }),
  setWidth: (width) => set({ width }),
  setHeight: (height) => set({ height }),
  setSteps: (steps) => set({ steps }),
  setCfgScale: (cfgScale) => set({ cfgScale }),
  setSeed: (seed) => set({ seed }),
  setSampler: (sampler) => set({ sampler }),
  setBatchSize: (batchSize) => set({ batchSize }),
  getParams: () => {
    const state = get();
    return {
      prompt: state.prompt,
      negativePrompt: state.negativePrompt,
      modelId: state.modelId,
      width: state.width,
      height: state.height,
      steps: state.steps,
      cfgScale: state.cfgScale,
      seed: state.seed,
      sampler: state.sampler,
      batchSize: state.batchSize,
    };
  },
  reset: () => set(defaults),
}));
