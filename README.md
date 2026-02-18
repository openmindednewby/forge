# Forge — Local Image Generation Platform

**Run Stable Diffusion on your own hardware. No cloud, no subscriptions, no data leaving your machine.**

Forge is an open-source image generation platform that runs entirely on your local GPU. It provides a clean, modern web interface for creating images from text prompts — without requiring you to wire up complex node-based workflows or wrestle with command-line scripts.

## Why Forge?

Existing local generation tools have a steep learning curve. ComfyUI is powerful but intimidating — new users face a blank canvas of nodes and wires before they can generate a single image. Automatic1111 works but shows its age with a Gradio interface that feels bolted together. Neither was designed as a polished product.

Forge takes a different approach:

- **Zero-friction start** — Type a prompt, click Generate. That's it. No nodes, no workflows, no YAML editing to get started.
- **Fully local** — Your prompts, images, and models never leave your machine. No API keys, no cloud accounts, no usage limits.
- **Pluggable backends** — Use HuggingFace Diffusers directly, connect to an existing ComfyUI instance, or run ONNX models on AMD/CPU. Switch backends from the settings page without restarting.
- **Built for consumer GPUs** — Targets RTX 4070 (12GB VRAM) as baseline. Automatic fp16, attention slicing, VAE tiling, and CPU offload keep memory usage in check.
- **Real-time feedback** — WebSocket-driven progress updates show you step-by-step previews as your image generates. No staring at a spinner wondering if it crashed.
- **Modern stack** — React 19, FastAPI, async everywhere. Fast to load, fast to develop on, easy to extend.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- NVIDIA GPU with CUDA (recommended: RTX 4070 12GB+)

### Setup

```bash
cd forge

# Backend
cd backend
python -m venv .venv
.venv/Scripts/pip install -e ".[dev,diffusers]"  # Windows
# source .venv/bin/activate && pip install -e ".[dev,diffusers]"  # Linux/Mac
cd ..

# Frontend
cd frontend
npm install
cd ..

# Configuration
cp forge.example.yaml forge.yaml
# Edit forge.yaml to set your model paths
```

### Run

```bash
# Terminal 1 — Backend
cd backend && .venv/Scripts/python -m uvicorn forge.main:app --reload --port 7860

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

> **No GPU?** Forge ships with a demo backend that generates procedural images using Pillow. It activates automatically when PyTorch isn't installed, so you can explore the full UI without a GPU.

### With Tilt (recommended for development)

```bash
pip install tilt
tilt up --port=10352
```

Starts backend (`localhost:7860`), frontend (`localhost:5173`), and Tilt dashboard (`localhost:10352`) with auto-reload.

## Models

Place `.safetensors` model files in `~/.forge/models/checkpoints/`. The directory is created automatically on first run.

Supported formats: `.safetensors`, `.ckpt`

## Architecture

```
forge/
├── backend/           # Python FastAPI
│   └── forge/
│       ├── api/       # REST + WebSocket endpoints
│       ├── backends/  # Pluggable AI backends (diffusers, comfyui, onnx, demo)
│       ├── core/      # Job queue, GPU worker, event bus
│       ├── db/        # SQLAlchemy async + SQLite
│       ├── models/    # Model manager
│       ├── schemas/   # Pydantic request/response models
│       └── storage/   # Image + thumbnail storage
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── api/       # HTTP client + WebSocket manager
│       ├── stores/    # Zustand state management
│       ├── hooks/     # React hooks
│       ├── pages/     # Generation, Gallery, Models, Settings
│       └── components/# UI components
├── e2e/               # Playwright E2E tests (57 tests)
├── scripts/           # Dev tooling
├── Tiltfile           # Tilt development workflow
└── forge.example.yaml # Configuration template
```

### Backend Design

- **Pluggable backends** — Abstract `BaseBackend` with concrete implementations for Diffusers, ComfyUI (API client), ONNX Runtime, and a GPU-free Demo. New backends register via decorator (`@register_backend("name")`).
- **Serial GPU worker** — Single consumer pulls jobs from an asyncio queue. One job at a time prevents OOM on consumer GPUs.
- **Event bus** — Job state changes broadcast to all connected WebSocket clients in real-time.
- **SQLite + async SQLAlchemy** — Zero-config persistence for job history, gallery metadata, and favorites.

### Frontend Design

- **Zustand** for local UI state (generation params, canvas, queue)
- **TanStack Query** for server data (gallery, model list)
- **Radix UI** primitives for accessible components
- **Tailwind CSS v4** with custom theme

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Submit a generation job |
| `/api/jobs/{id}` | GET | Get job status and results |
| `/api/jobs/{id}/cancel` | POST | Cancel a running job |
| `/api/models` | GET | List available models |
| `/api/models/{id}/load` | POST | Load a model into VRAM |
| `/api/models/unload` | POST | Unload current model |
| `/api/gallery` | GET | Browse generated images |
| `/api/gallery/{id}/image` | GET | Serve full-size image |
| `/api/gallery/{id}/thumbnail` | GET | Serve thumbnail |
| `/api/gallery/{id}/favorite` | PATCH | Toggle favorite |
| `/api/settings` | GET/PUT | Read/update configuration |
| `/api/system/info` | GET | System and GPU info |
| `/api/system/health` | GET | Health check |
| `/ws/jobs` | WebSocket | Real-time job progress |

## Testing

```bash
# Backend unit tests
cd backend && .venv/Scripts/python -m pytest tests/ -v

# Frontend type-check
cd frontend && npx tsc --noEmit

# E2E tests (starts backend + frontend automatically)
cd e2e && npx playwright test
```

## Tech Stack

**Backend:** Python 3.11+, FastAPI, SQLAlchemy (async), SQLite, HuggingFace Diffusers, PyTorch

**Frontend:** React 19, Vite 6, TypeScript 5.7, Zustand 5, TanStack Query 5, Tailwind CSS v4, Radix UI, Lucide Icons

**Testing:** Playwright (E2E), Pytest (backend)

## Roadmap

- [x] Text-to-image generation
- [x] Real-time progress with WebSocket
- [x] Gallery with favorites
- [x] Model management
- [x] Demo backend (no GPU required)
- [ ] Image-to-image
- [ ] Inpainting / outpainting canvas
- [ ] LoRA support with weight sliders
- [ ] ControlNet (Canny, Depth, OpenPose)
- [ ] ComfyUI backend adapter
- [ ] ONNX backend (AMD / CPU)
- [ ] Batch generation
- [ ] CivitAI model downloads

## License

[MIT](LICENSE) — Use it however you want.
