"""Development server launcher — runs backend and frontend concurrently."""

import subprocess
import sys
import os
import signal
from pathlib import Path

ROOT = Path(__file__).parent.parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


def main():
    processes = []

    try:
        # Start backend
        print("[dev] Starting backend on http://localhost:7860")
        backend = subprocess.Popen(
            [
                sys.executable, "-m", "uvicorn",
                "forge.main:app",
                "--reload",
                "--host", "0.0.0.0",
                "--port", "7860",
            ],
            cwd=str(BACKEND_DIR),
            env={**os.environ, "PYTHONPATH": str(BACKEND_DIR)},
        )
        processes.append(backend)

        # Start frontend
        print("[dev] Starting frontend on http://localhost:5173")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        frontend = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=str(FRONTEND_DIR),
        )
        processes.append(frontend)

        print("[dev] Both servers running. Press Ctrl+C to stop.")

        # Wait for any process to exit
        for proc in processes:
            proc.wait()

    except KeyboardInterrupt:
        print("\n[dev] Shutting down...")
    finally:
        for proc in processes:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except (subprocess.TimeoutExpired, OSError):
                proc.kill()
        print("[dev] Done.")


if __name__ == "__main__":
    main()
