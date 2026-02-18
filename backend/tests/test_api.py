"""Basic API tests for the Forge backend."""

import pytest
from httpx import ASGITransport, AsyncClient

from forge.config import Settings
from forge.main import create_app


@pytest.fixture
def settings(tmp_path):
    """Create test settings with temp directories."""
    return Settings(
        paths={"base_dir": str(tmp_path / ".forge")},
        backend={"active": "diffusers"},
    )


@pytest.fixture
async def client(settings):
    """Create test HTTP client with full lifespan."""
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client


@pytest.mark.asyncio
async def test_health_check(client):
    resp = await client.get("/api/system/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_system_info(client):
    resp = await client.get("/api/system/info")
    assert resp.status_code == 200
    data = resp.json()
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_list_models_empty(client):
    resp = await client.get("/api/models")
    assert resp.status_code == 200
    data = resp.json()
    assert data["models"] == []


@pytest.mark.asyncio
async def test_list_gallery_empty(client):
    resp = await client.get("/api/gallery")
    assert resp.status_code == 200
    data = resp.json()
    assert data["images"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_settings(client):
    resp = await client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert "gpu" in data
    assert "generation" in data


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    resp = await client.get("/api/jobs/nonexistent")
    assert resp.status_code == 404
