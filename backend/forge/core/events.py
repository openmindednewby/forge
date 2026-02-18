"""Event bus for broadcasting job updates to WebSocket clients."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

logger = logging.getLogger("forge.events")


class EventBus:
    """Simple pub/sub event bus for broadcasting to WebSocket clients."""

    def __init__(self) -> None:
        self._subscribers: list[asyncio.Queue[dict[str, Any]]] = []

    def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        """Create a new subscription queue for a WebSocket client."""
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=100)
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        """Remove a subscription."""
        self._subscribers = [q for q in self._subscribers if q is not queue]

    async def publish(self, event: dict[str, Any]) -> None:
        """Broadcast an event to all subscribers."""
        dead: list[asyncio.Queue[dict[str, Any]]] = []
        for queue in self._subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                dead.append(queue)
                logger.warning("Dropping slow WebSocket subscriber")

        for q in dead:
            self._subscribers = [s for s in self._subscribers if s is not q]

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)
