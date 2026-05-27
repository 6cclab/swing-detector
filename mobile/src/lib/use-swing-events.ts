import { useEffect, useRef } from "react";
import { API_BASE_URL } from "./config";
import { getToken } from "./auth";

type SwingEvent = {
  type: string;
  swing_id: string;
  status: string;
  score?: number;
};

export function useSwingEvents(onEvent: (event: SwingEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let aborted = false;
    let controller: AbortController | null = null;

    async function connect() {
      const token = await getToken();
      if (!token || aborted) return;

      controller = new AbortController();
      try {
        const res = await fetch(`${API_BASE_URL}/api/swings/events/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6)) as SwingEvent;
                if (event.swing_id) {
                  onEventRef.current(event);
                }
              } catch {
                // ignore malformed events
              }
            }
          }
        }
      } catch {
        // reconnect after delay on error/disconnect
        if (!aborted) {
          setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      aborted = true;
      controller?.abort();
    };
  }, []);
}
