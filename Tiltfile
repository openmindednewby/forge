# ===============================================================================
# FORGE — LOCAL IMAGE GENERATION PLATFORM - TILTFILE
# ===============================================================================
#
# A standalone Tiltfile for the Forge project.
# Run with: tilt up --port=10352
#
# Resource Groups:
#   Backend   - Python FastAPI backend (port 7860)
#   Frontend  - React + Vite dev server (port 5173)
#   Testing   - Backend pytest, frontend type-check
#   Quality   - Lint, security audit, dependency health
#
# ===============================================================================

# ===============================================================================
# 1. BACKEND
# ===============================================================================

# --- Backend Dev Server (FastAPI + uvicorn --reload) ---
local_resource(
    name='forge-backend',
    labels=['Backend'],
    serve_cmd='.venv\\Scripts\\python -m uvicorn forge.main:app --reload --host 0.0.0.0 --port 7860',
    serve_dir='backend',
    links=[
        link('http://localhost:7860/docs', 'API Docs (Swagger)'),
        link('http://localhost:7860/redoc', 'API Docs (ReDoc)'),
        link('http://localhost:7860/api/system/health', 'Health Check'),
        link('http://localhost:7860/api/system/info', 'System Info'),
    ],
    readiness_probe=probe(
        http_get=http_get_action(port=7860, path='/api/system/health'),
        initial_delay_secs=5,
        period_secs=10,
    ),
)

# --- Backend Install Dependencies ---
local_resource(
    name='forge-backend-install',
    labels=['Backend'],
    cmd='cd backend && .venv\\Scripts\\pip install -e ".[dev]"',
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False,
    allow_parallel=True,
)

# ===============================================================================
# 2. FRONTEND
# ===============================================================================

# --- Frontend Dev Server (Vite, proxies /api + /ws to backend) ---
local_resource(
    name='forge-frontend',
    labels=['Frontend'],
    serve_cmd='npm run dev',
    serve_dir='frontend',
    resource_deps=['forge-backend'],
    links=[
        link('http://localhost:5173', 'Forge UI'),
        link('http://localhost:5173/gallery', 'Gallery'),
        link('http://localhost:5173/models', 'Models'),
        link('http://localhost:5173/settings', 'Settings'),
    ],
)

# --- Frontend Install Dependencies ---
local_resource(
    name='forge-frontend-install',
    labels=['Frontend'],
    cmd='cd frontend && npm install',
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False,
    allow_parallel=True,
)

# ===============================================================================
# 3. TESTING
# ===============================================================================

# --- Backend Tests (pytest) ---
local_resource(
    name='forge-backend-tests',
    labels=['Testing'],
    cmd='cd backend && .venv\\Scripts\\python -m pytest tests/ -v --tb=short',
    trigger_mode=TRIGGER_MODE_MANUAL,
    allow_parallel=True,
)

# --- Backend Tests with Coverage ---
local_resource(
    name='forge-backend-tests-coverage',
    labels=['Testing'],
    cmd='cd backend && .venv\\Scripts\\python -m pytest tests/ -v --cov=forge --cov-report=term-missing',
    trigger_mode=TRIGGER_MODE_MANUAL,
    allow_parallel=True,
)

# --- Frontend Type Check ---
local_resource(
    name='forge-frontend-typecheck',
    labels=['Testing'],
    cmd='cd frontend && npx tsc --noEmit',
    trigger_mode=TRIGGER_MODE_MANUAL,
    allow_parallel=True,
)

# --- Frontend Build (production) ---
local_resource(
    name='forge-frontend-build',
    labels=['Testing'],
    cmd='cd frontend && npx vite build',
    trigger_mode=TRIGGER_MODE_MANUAL,
    allow_parallel=True,
)

# --- E2E Tests (Playwright, depends on frontend + backend) ---
local_resource(
    name='forge-e2e',
    labels=['Testing'],
    cmd='cd e2e && npx playwright test',
    resource_deps=['forge-frontend', 'forge-backend'],
    trigger_mode=TRIGGER_MODE_MANUAL,
)

# --- E2E Tests (headed, for debugging) ---
local_resource(
    name='forge-e2e-headed',
    labels=['Testing'],
    cmd='cd e2e && npx playwright test --headed',
    resource_deps=['forge-frontend', 'forge-backend'],
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False,
)

# ===============================================================================
# 4. QUALITY
# ===============================================================================

# --- Backend Lint (ruff) ---
local_resource(
    name='forge-backend-lint',
    labels=['Quality'],
    cmd='cd backend && .venv\\Scripts\\ruff check forge/',
    trigger_mode=TRIGGER_MODE_MANUAL,
    allow_parallel=True,
)

# --- Backend Lint Fix ---
local_resource(
    name='forge-backend-lint-fix',
    labels=['Quality'],
    cmd='cd backend && .venv\\Scripts\\ruff check --fix forge/',
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False,
    allow_parallel=True,
)

# --- Frontend Security Audit ---
local_resource(
    name='forge-frontend-audit',
    labels=['Quality'],
    cmd='cd frontend && npm audit --audit-level=high',
    trigger_mode=TRIGGER_MODE_MANUAL,
    allow_parallel=True,
)

# --- Dependency Health Check ---
local_resource(
    name='forge-deps-health',
    labels=['Quality'],
    cmd='powershell -Command "cd frontend; npm outdated; exit 0"',
    trigger_mode=TRIGGER_MODE_MANUAL,
    allow_parallel=True,
)
