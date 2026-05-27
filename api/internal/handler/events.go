package handler

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"

	"github.com/6cclab/swing-detector/api/internal/middleware"
)

type EventsHandler struct {
	rdb *redis.Client
}

func NewEventsHandler(rdb *redis.Client) *EventsHandler {
	return &EventsHandler{rdb: rdb}
}

type SwingEvent struct {
	Type    string  `json:"type"`
	SwingID string  `json:"swing_id"`
	Status  string  `json:"status"`
	Score   float64 `json:"score,omitempty"`
}

func userChannel(userID string) string {
	return fmt.Sprintf("swing:events:%s", userID)
}

func PublishSwingEvent(rdb *redis.Client, userID string, event SwingEvent) {
	data, err := json.Marshal(event)
	if err != nil {
		slog.Error("failed to marshal event", "err", err)
		return
	}
	if err := rdb.Publish(context.Background(), userChannel(userID), data).Err(); err != nil {
		slog.Error("failed to publish event", "err", err, "user_id", userID)
	}
}

func (h *EventsHandler) Stream(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	ctx := c.Context()
	ctx.SetBodyStreamWriter(func(w *bufio.Writer) {
		subCtx, cancel := context.WithCancel(context.Background())
		defer cancel()

		sub := h.rdb.Subscribe(subCtx, userChannel(userID))
		defer sub.Close()

		ch := sub.Channel()

		fmt.Fprintf(w, "event: connected\ndata: {}\n\n")
		w.Flush()

		for msg := range ch {
			fmt.Fprintf(w, "event: swing_update\ndata: %s\n\n", msg.Payload)
			if err := w.Flush(); err != nil {
				return
			}
		}
	})

	return nil
}
