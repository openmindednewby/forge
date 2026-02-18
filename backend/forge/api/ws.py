"""WebSocket endpoint for real-time job updates."""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger("forge.ws")


@router.websocket("/ws/jobs")
async def websocket_jobs(websocket: WebSocket):
    """WebSocket endpoint that broadcasts job progress events."""
    await websocket.accept()
    event_bus = websocket.app.state.event_bus
    queue = event_bus.subscribe()

    logger.info("WebSocket client connected (total: %d)", event_bus.subscriber_count)

    try:
        while True:
            event = await queue.get()
            await websocket.send_text(json.dumps(event))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.debug("WebSocket error: %s", e)
    finally:
        event_bus.unsubscribe(queue)
        logger.info(
            "WebSocket client disconnected (total: %d)", event_bus.subscriber_count
        )
