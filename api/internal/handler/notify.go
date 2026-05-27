package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/6cclab/swing-detector/api/internal/models"
)

type NotifyHandler struct {
	db  *gorm.DB
	rdb *redis.Client
}

func NewNotifyHandler(db *gorm.DB, rdb *redis.Client) *NotifyHandler {
	return &NotifyHandler{db: db, rdb: rdb}
}

type swingCompleteRequest struct {
	SwingID string `json:"swing_id"`
	UserID  string `json:"user_id"`
}

func (h *NotifyHandler) SwingComplete(c *fiber.Ctx) error {
	var body swingCompleteRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.SwingID == "" || body.UserID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "swing_id and user_id are required"})
	}

	var user models.User
	if err := h.db.Where("id = ?", body.UserID).First(&user).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if !user.Notifications || user.ExpoPushToken == "" {
		return c.JSON(fiber.Map{"sent": false, "reason": "notifications disabled or no token"})
	}

	var swing models.Swing
	if err := h.db.Where("id = ?", body.SwingID).First(&swing).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Swing not found"})
	}

	var title, message string
	if swing.Status == "failed" {
		title = "Swing Analysis Failed"
		message = "Something went wrong analyzing your swing. Tap to try again."
	} else {
		scoreText := "complete"
		if swing.OverallScore != nil {
			scoreText = fmt.Sprintf("scored %.0f", *swing.OverallScore)
		}
		title = "Swing Analysis Complete"
		message = fmt.Sprintf("Your swing %s. Tap to see details.", scoreText)
	}

	if err := sendExpoPush(user.ExpoPushToken, title, message,
		map[string]string{"swing_id": body.SwingID, "screen": "swing"},
	); err != nil {
		slog.Error("failed to send push notification", "err", err, "user_id", body.UserID)
	}

	score := 0.0
	if swing.OverallScore != nil {
		score = *swing.OverallScore
	}
	PublishSwingEvent(h.rdb, body.UserID, SwingEvent{
		Type:    "swing_update",
		SwingID: body.SwingID,
		Status:  swing.Status,
		Score:   score,
	})

	return c.JSON(fiber.Map{"sent": true})
}

func sendExpoPush(token, title, body string, data map[string]string) error {
	payload := map[string]any{
		"to":    token,
		"title": title,
		"body":  body,
		"data":  data,
		"sound": "default",
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(
		"https://exp.host/--/api/v2/push/send",
		"application/json",
		bytes.NewReader(jsonBytes),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("expo push API returned %d", resp.StatusCode)
	}

	return nil
}
