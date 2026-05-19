package middleware

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
)

func LoggingMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		duration := time.Since(start)
		status := c.Response().StatusCode()

		level := slog.LevelInfo
		if status >= 500 {
			level = slog.LevelError
		} else if status >= 400 {
			level = slog.LevelWarn
		}

		slog.Log(c.Context(), level, "request",
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"duration", duration.String(),
			"user_id", GetUserID(c),
		)

		return err
	}
}
