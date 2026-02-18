import { useQuery } from "@tanstack/react-query";
import { Cpu, Info } from "lucide-react";
import { getSystemInfo } from "../api/client";

export function SettingsPage() {
  const { data: sysInfo } = useQuery({
    queryKey: ["system-info"],
    queryFn: getSystemInfo,
    refetchInterval: 5000,
  });

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* System Info */}
          <section className="rounded-lg border border-neutral-800 bg-surface-2 p-5">
            <h2 className="mb-4 flex items-center gap-2 font-medium">
              <Cpu className="h-5 w-5 text-forge-400" />
              System Information
            </h2>

            {sysInfo ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow label="Version" value={`Forge v${sysInfo.version}`} />
                <InfoRow label="Backend" value={sysInfo.backend} />
                <InfoRow label="Python" value={sysInfo.python_version} />
                <InfoRow label="GPU" value={sysInfo.gpu.name} />
                {sysInfo.gpu.vram_total_mb > 0 && (
                  <>
                    <InfoRow
                      label="VRAM Total"
                      value={`${sysInfo.gpu.vram_total_mb} MB`}
                    />
                    <InfoRow
                      label="VRAM Used"
                      value={`${sysInfo.gpu.vram_used_mb} MB`}
                    />
                    <InfoRow
                      label="VRAM Free"
                      value={`${sysInfo.gpu.vram_free_mb} MB`}
                    />
                    <InfoRow label="CUDA" value={sysInfo.gpu.cuda_version} />
                  </>
                )}
                <InfoRow
                  label="Queue"
                  value={`${sysInfo.queue_length} jobs`}
                />
                <InfoRow
                  label="Models Loaded"
                  value={
                    sysInfo.models_loaded.length > 0
                      ? sysInfo.models_loaded.join(", ")
                      : "None"
                  }
                />
              </div>
            ) : (
              <p className="text-neutral-500">Loading system info...</p>
            )}
          </section>

          {/* About */}
          <section className="rounded-lg border border-neutral-800 bg-surface-2 p-5">
            <h2 className="mb-4 flex items-center gap-2 font-medium">
              <Info className="h-5 w-5 text-forge-400" />
              About
            </h2>
            <div className="space-y-2 text-sm text-neutral-400">
              <p>
                Forge is a local image generation platform. Generate images from
                text prompts using Stable Diffusion models running directly on
                your GPU.
              </p>
              <p>
                Place model files (.safetensors) in the models/checkpoints
                directory to get started.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-neutral-500">{label}</span>
      <p className="text-neutral-200">{value}</p>
    </div>
  );
}
