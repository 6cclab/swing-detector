package models

import "time"

type Swing struct {
	ID            string    `gorm:"type:text;primaryKey" json:"id"`
	UserID        string    `gorm:"type:text;not null;index" json:"user_id"`
	CreatedAt     time.Time `json:"created_at"`
	Status        string    `gorm:"default:pending" json:"status"`
	VideoPath     string    `gorm:"not null" json:"video_path"`
	Handedness    string    `gorm:"default:right" json:"handedness"`
	AnalysisJSON  *string   `gorm:"column:analysis_json;type:text" json:"-"`
	OverallScore  *float64  `gorm:"column:overall_score" json:"overall_score"`
	ErrorMessage  *string   `gorm:"column:error_message" json:"error_message"`
	SourceSwingID *string   `gorm:"column:source_swing_id" json:"source_swing_id,omitempty"`
	SwingIndex    *int      `gorm:"column:swing_index" json:"swing_index,omitempty"`
}

type SwingUploadResponse struct {
	SwingID string `json:"swing_id"`
	Status  string `json:"status"`
}

type SwingSummary struct {
	ID            string    `json:"id"`
	CreatedAt     time.Time `json:"created_at"`
	Status        string    `json:"status"`
	OverallScore  *float64  `json:"overall_score"`
	Handedness    string    `json:"handedness"`
	SourceSwingID *string   `json:"source_swing_id,omitempty"`
	SwingIndex    *int      `json:"swing_index,omitempty"`
}

type SwingListResponse struct {
	Items    []SwingSummary `json:"items"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"page_size"`
}

type ProgressPoint struct {
	Date  time.Time `json:"date"`
	Score float64   `json:"score"`
}

type AngleTrend struct {
	AngleName string      `json:"angle_name"`
	Values    []float64   `json:"values"`
	Dates     []time.Time `json:"dates"`
}

type ProgressResponse struct {
	Scores      []ProgressPoint `json:"scores"`
	AngleTrends []AngleTrend    `json:"angle_trends"`
}
