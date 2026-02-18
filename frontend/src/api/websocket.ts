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

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30_000;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Set<EventHandler> = new Set();
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

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketEvent;
        this.handlers.forEach((handler) => handler(data));
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    if (this.reconnectTimer) {
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
    if (this.reconnectTimer) return;
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
