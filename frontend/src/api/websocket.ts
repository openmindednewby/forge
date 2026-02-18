import { isValueDefined } from "../utils/typeGuards";

type EventHandler = (event: WebSocketEvent) => void;

export interface ProgressEvent {
  type: "job:progress";
  job_id: string;
  step: number;
  total_steps: number;
  percentage: number;
  preview_image: string | null;
}

export interface JobStartedEvent {
  type: "job:started";
  job_id: string;
}

export interface JobCompletedEvent {
  type: "job:completed";
  job_id: string;
  images: Array<{
    id: string;
    file_path: string;
    thumbnail_path: string;
    width: number;
    height: number;
    seed: number;
  }>;
  elapsed_seconds: number;
}

export interface JobFailedEvent {
  type: "job:failed";
  job_id: string;
  error: string;
}

export type WebSocketEvent =
  | ProgressEvent
  | JobStartedEvent
  | JobCompletedEvent
  | JobFailedEvent;

const EVENT_TYPES = new Set([
  "job:progress",
  "job:started",
  "job:completed",
  "job:failed",
]);

const hasStringType = (
  data: object,
): data is { type: string } =>
  "type" in data && typeof data.type === "string";

const isWebSocketEvent = (data: unknown): data is WebSocketEvent => {
  if (typeof data !== "object" || !isValueDefined(data)) return false;
  return hasStringType(data) && EVENT_TYPES.has(data.type);
};

const parseEvent = (raw: string): WebSocketEvent | null => {
  const parsed: unknown = JSON.parse(raw);
  if (isWebSocketEvent(parsed)) return parsed;
  return null;
};

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30_000;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers = new Set<EventHandler>();
  private reconnectDelay = RECONNECT_DELAY_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionallyClosed = false;

  connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    )
      return;

    this.intentionallyClosed = false;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/jobs`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = RECONNECT_DELAY_MS;
    };

    this.ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = parseEvent(event.data);
        if (isValueDefined(data))
          this.handlers.forEach((handler) => handler(data));
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (!this.intentionallyClosed)
        this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    if (isValueDefined(this.reconnectTimer)) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private scheduleReconnect(): void {
    if (isValueDefined(this.reconnectTimer)) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        MAX_RECONNECT_DELAY_MS,
      );
      this.connect();
    }, this.reconnectDelay);
  }
}

export const wsManager = new WebSocketManager();
