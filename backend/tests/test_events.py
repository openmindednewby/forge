"""Tests for the event bus."""

import asyncio

import pytest

from forge.core.events import EventBus


@pytest.mark.asyncio
async def test_publish_subscribe():
    bus = EventBus()
    queue = bus.subscribe()
    assert bus.subscriber_count == 1

    await bus.publish({"type": "test", "data": 42})
    event = await asyncio.wait_for(queue.get(), timeout=1.0)
    assert event["type"] == "test"
    assert event["data"] == 42


@pytest.mark.asyncio
async def test_unsubscribe():
    bus = EventBus()
    queue = bus.subscribe()
    bus.unsubscribe(queue)
    assert bus.subscriber_count == 0


@pytest.mark.asyncio
async def test_multiple_subscribers():
    bus = EventBus()
    q1 = bus.subscribe()
    q2 = bus.subscribe()

    await bus.publish({"type": "broadcast"})

    e1 = await asyncio.wait_for(q1.get(), timeout=1.0)
    e2 = await asyncio.wait_for(q2.get(), timeout=1.0)
    assert e1["type"] == "broadcast"
    assert e2["type"] == "broadcast"
