# Forge — Vision & Roadmap

## The Problem

Local image generation in 2026 is powerful but painful:

1. **ComfyUI** is the most capable tool, but it's a node graph editor. Generating a simple image requires connecting 8+ nodes correctly. New users bounce off the complexity. Power users spend more time debugging workflows than creating images.

2. **Automatic1111 / Forge (the other one)** has a simpler interface but it's built on Gradio, feels dated, has a sprawling settings page, and the codebase is difficult to extend. Extensions conflict with each other. Startup takes 30+ seconds even before generation begins.

3. **Cloud services** (Midjourney, DALL-E, Firefly) are polished but your prompts and images live on someone else's server. Usage costs add up. Creative freedom is limited by content policies. You can't use custom models.

4. **CLI/script approaches** are fast but have zero discoverability. You need to know what ControlNet is before you can use it. No preview, no gallery, no iteration loop.

**The gap:** There is no local generation tool that combines a polished product experience with the full power of Stable Diffusion. You either get simplicity (cloud) or capability (ComfyUI), not both.

## What Forge Solves

Forge fills this gap by being **the local generation tool you'd actually recommend to a friend**:

- **Immediate productivity** — Open the app, type a prompt, get an image. No node wiring, no YAML, no CLI flags. The UI guides you through what's possible without requiring you to know the terminology upfront.

- **Full power when you need it** — Negative prompts, LoRA weights, ControlNet, inpainting canvas, scheduler selection — it's all there, but progressive. Basic controls are visible, advanced ones expand on demand.

- **Privacy by default** — Everything runs on your machine. Your creative process stays private. No terms of service governing what you can generate. No usage limits.

- **One platform, many engines** — Diffusers for maximum control, ComfyUI for complex workflows (without the node UI), ONNX for AMD and CPU. Switch between them without reinstalling anything.

- **Developer-friendly** — Clean codebase, typed Python + TypeScript, async everywhere, documented API. Adding a new backend or parameter takes minutes, not days.

## Where We Are (v0.1)

Working MVP with:
- Text-to-image generation via Diffusers backend
- Demo backend for GPU-free exploration
- Real-time WebSocket progress with step count
- Gallery with favorites
- Model management (filesystem scan)
- Settings page
- 57 E2E tests passing
- Tilt-based dev workflow

## Where We're Going

### Phase 1 — Complete Single-Backend Experience (v0.2)

**Goal:** Every generation mode works with the Diffusers backend. A user with one GPU can do everything.

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| Image-to-image | P0 | TODO | Upload source image, adjust denoising strength |
| Inpainting canvas | P0 | TODO | Brush-based mask painting with Konva.js, undo/redo |
| Outpainting | P1 | TODO | Extend image beyond borders with mask |
| LoRA support | P0 | TODO | Load multiple LoRAs with individual weight sliders |
| VAE selection | P1 | TODO | Dropdown to pick VAE, auto-detect compatible ones |
| Scheduler selection | P0 | TODO | Full list (Euler, DPM++, UniPC, etc.) with explanations |
| Upscaling | P1 | TODO | RealESRGAN 4x, tile-based for large images |
| ControlNet | P1 | TODO | Canny, Depth, OpenPose preprocessors, weight/guidance |
| Preview images | P0 | TODO | Base64 JPEG every 5 steps during generation |
| Prompt weighting | P1 | TODO | `(word:1.5)` syntax with visual weight editor |
| Prompt history | P2 | TODO | Searchable history with re-use, per-prompt results |
| Send to img2img | P1 | TODO | Click gallery image → opens in img2img with params |
| PNG metadata | P1 | TODO | Embed params in tEXt chunks (A1111-compatible) |
| Model manager | P0 | TODO | HuggingFace download by URL, progress bar, cancel |
| Keyboard shortcuts | P2 | TODO | Ctrl+Enter to generate, Escape to cancel, etc. |

### Phase 2 — Multi-Backend & Polish (v1.0)

**Goal:** All three backends work. Production quality. Installable by non-developers.

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| ComfyUI backend | P0 | TODO | HTTP+WS client, workflow translation for all modes |
| ONNX backend | P1 | TODO | DirectML (AMD GPUs), CPU fallback |
| Backend hot-swap | P0 | TODO | Switch backends from settings without restart |
| Batch generation | P1 | TODO | Generate N variations of same prompt in one job |
| Multi-ControlNet | P2 | TODO | Stack multiple ControlNet conditions |
| CivitAI downloads | P1 | TODO | Search and download models directly from CivitAI |
| torch.compile() | P2 | TODO | Warm-up compilation for 2-3x faster repeat generation |
| GGUF support | P2 | TODO | Quantized model loading for lower VRAM usage |
| Image comparison | P2 | TODO | Side-by-side slider to compare two outputs |
| One-click installer | P0 | TODO | Windows .exe, Linux AppImage, Mac .dmg |
| Prompt templates | P2 | TODO | Save/load prompt templates with parameter presets |
| Queue management | P1 | TODO | Drag to reorder, priority levels, pause/resume |

### Phase 3 — Community & Ecosystem (v2.0)

**Goal:** Forge becomes a platform others build on.

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| Plugin system | P1 | TODO | Custom backends, preprocessors, postprocessors as plugins |
| Workflow sharing | P2 | TODO | Export/import generation configs as shareable files |
| Extension API | P1 | TODO | REST API for external tool integration |
| Multi-GPU | P2 | TODO | Distribute jobs across multiple GPUs |
| Remote worker | P2 | TODO | Run backend on a different machine (headless server) |
| Mobile-responsive UI | P1 | TODO | Use Forge from phone/tablet on local network |
| Localization | P2 | TODO | i18n for non-English speakers |
| Themes | P2 | TODO | Custom color themes, community theme sharing |

## Success Criteria

Forge succeeds if:

1. **A person who has never used Stable Diffusion** can install it, generate their first image, and understand what to try next — in under 10 minutes.

2. **A ComfyUI power user** finds it faster for 80% of their daily generation tasks, and still has ComfyUI available as a backend for the other 20%.

3. **A developer** can add a new backend, generation mode, or UI feature in an afternoon by following existing patterns.

4. **The project is self-sustaining** — clear documentation, tested codebase, and welcoming contributor experience attract external contributors.

## Technical Principles

- **Async everywhere** — No blocking the event loop. GPU work happens in the worker, everything else is non-blocking.
- **One job at a time** — Consumer GPUs can't handle concurrent inference. Serial execution prevents OOM and makes progress reporting predictable.
- **Progressive disclosure** — Show simple controls by default, reveal advanced options on demand. Never overwhelm new users.
- **Backend-agnostic API** — The frontend doesn't know which backend is running. Any new backend just implements the abstract interface.
- **Test what matters** — E2E tests for user flows, unit tests for business logic. No testing for testing's sake.
- **Zero external services** — No telemetry, no analytics, no license servers. Works fully offline after install.
