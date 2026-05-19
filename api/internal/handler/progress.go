package handler

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/6cclab/swing-detector/api/internal/middleware"
	"github.com/6cclab/swing-detector/api/internal/models"
)

type ProgressHandler struct {
	db *gorm.DB
}

func NewProgressHandler(db *gorm.DB) *ProgressHandler {
	return &ProgressHandler{db: db}
}

var trackedAngles = []string{
	"hip_rotation_deg",
	"shoulder_rotation_deg",
	"spine_angle_deg",
	"weight_transfer_ratio",
}

func (h *ProgressHandler) GetProgress(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var swings []models.Swing
	h.db.Where("user_id = ? AND status = ? AND overall_score IS NOT NULL", userID, "complete").
		Order("created_at ASC").
		Find(&swings)

	scores := make([]models.ProgressPoint, 0, len(swings))
	angleData := make(map[string]*models.AngleTrend)

	for _, s := range swings {
		if s.OverallScore != nil {
			scores = append(scores, models.ProgressPoint{
				Date:  s.CreatedAt,
				Score: *s.OverallScore,
			})
		}

		if s.AnalysisJSON == nil {
			continue
		}

		var analysis struct {
			PhasesDetected []struct {
				Phase  string         `json:"phase"`
				Angles map[string]any `json:"angles"`
			} `json:"phases_detected"`
		}
		if err := json.Unmarshal([]byte(*s.AnalysisJSON), &analysis); err != nil {
			continue
		}

		for _, phase := range analysis.PhasesDetected {
			if phase.Phase != "impact" {
				continue
			}
			for _, angleName := range trackedAngles {
				val, ok := phase.Angles[angleName]
				if !ok || val == nil {
					continue
				}
				fval, ok := val.(float64)
				if !ok {
					continue
				}
				trend, exists := angleData[angleName]
				if !exists {
					trend = &models.AngleTrend{AngleName: angleName}
					angleData[angleName] = trend
				}
				trend.Values = append(trend.Values, fval)
				trend.Dates = append(trend.Dates, s.CreatedAt)
			}
		}
	}

	angleTrends := make([]models.AngleTrend, 0, len(angleData))
	for _, trend := range angleData {
		angleTrends = append(angleTrends, *trend)
	}

	return c.JSON(models.ProgressResponse{
		Scores:      scores,
		AngleTrends: angleTrends,
	})
}
