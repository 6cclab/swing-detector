package handler

import (
	"encoding/json"
	"fmt"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/6cclab/swing-detector/api/internal/middleware"
	"github.com/6cclab/swing-detector/api/internal/models"
	"github.com/6cclab/swing-detector/api/internal/queue"
	"github.com/6cclab/swing-detector/api/internal/storage"
)

type SwingHandler struct {
	db    *gorm.DB
	store storage.Storage
	queue *queue.Queue
}

func NewSwingHandler(db *gorm.DB, store storage.Storage, q *queue.Queue) *SwingHandler {
	return &SwingHandler{db: db, store: store, queue: q}
}

func (h *SwingHandler) Upload(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	file, err := c.FormFile("video")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Video file is required"})
	}

	if ct := file.Header.Get("Content-Type"); ct != "" {
		if len(ct) < 6 || ct[:6] != "video/" {
			return c.Status(400).JSON(fiber.Map{"error": "File must be a video"})
		}
	}

	handedness := c.Query("handedness", "right")

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to read file"})
	}
	defer f.Close()

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".mp4"
	}

	storedPath, err := h.store.SaveVideoStream(f, ext)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save video"})
	}

	swingID := uuid.New().String()
	swing := models.Swing{
		ID:         swingID,
		UserID:     userID,
		VideoPath:  storedPath,
		Handedness: handedness,
		Status:     "pending",
	}

	if err := h.db.Create(&swing).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create swing record"})
	}

	if err := h.queue.Publish(c.Context(), queue.SwingJob{
		SwingID:    swingID,
		VideoPath:  storedPath,
		Handedness: handedness,
		UserID:     userID,
	}); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to queue analysis"})
	}

	return c.Status(202).JSON(models.SwingUploadResponse{
		SwingID: swingID,
		Status:  "processing",
	})
}

func (h *SwingHandler) Get(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	swingID := c.Params("id")

	var swing models.Swing
	if err := h.db.Where("id = ? AND user_id = ?", swingID, userID).First(&swing).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Swing not found"})
	}

	if swing.Status != "complete" || swing.AnalysisJSON == nil {
		return c.JSON(fiber.Map{
			"swing_id":      swing.ID,
			"status":        swing.Status,
			"error_message": swing.ErrorMessage,
		})
	}

	var result json.RawMessage
	if err := json.Unmarshal([]byte(*swing.AnalysisJSON), &result); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse analysis"})
	}

	return c.JSON(result)
}

func (h *SwingHandler) List(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)

	if page < 1 {
		page = 1
	}

	var total int64
	h.db.Model(&models.Swing{}).Where("user_id = ?", userID).Count(&total)

	var swings []models.Swing
	h.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&swings)

	items := make([]models.SwingSummary, len(swings))
	for i, s := range swings {
		items[i] = models.SwingSummary{
			ID:           s.ID,
			CreatedAt:    s.CreatedAt,
			Status:       s.Status,
			OverallScore: s.OverallScore,
			Handedness:   s.Handedness,
		}
	}

	return c.JSON(models.SwingListResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (h *SwingHandler) ListFrames(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	swingID := c.Params("id")

	var swing models.Swing
	if err := h.db.Where("id = ? AND user_id = ?", swingID, userID).First(&swing).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Swing not found"})
	}

	if swing.Status != "complete" || swing.AnalysisJSON == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Swing not complete"})
	}

	var analysis struct {
		PhasesDetected []struct {
			Phase string `json:"phase"`
		} `json:"phases_detected"`
	}
	if err := json.Unmarshal([]byte(*swing.AnalysisJSON), &analysis); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse analysis"})
	}

	type frameInfo struct {
		Phase string `json:"phase"`
		URL   string `json:"url"`
	}

	frames := make([]frameInfo, len(analysis.PhasesDetected))
	for i, p := range analysis.PhasesDetected {
		frames[i] = frameInfo{
			Phase: p.Phase,
			URL:   fmt.Sprintf("/api/swings/%s/frames/%s", swingID, p.Phase),
		}
	}

	return c.JSON(fiber.Map{
		"swing_id": swingID,
		"frames":   frames,
	})
}

func (h *SwingHandler) GetFrame(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	swingID := c.Params("id")
	phase := c.Params("phase")

	var swing models.Swing
	if err := h.db.Where("id = ? AND user_id = ?", swingID, userID).First(&swing).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Swing not found"})
	}

	if swing.Status != "complete" {
		return c.Status(404).JSON(fiber.Map{"error": "Swing not complete"})
	}

	data, err := h.store.ReadFrame(swingID, phase)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Frame not available"})
	}

	c.Set("Content-Type", "image/jpeg")
	return c.Send(data)
}
