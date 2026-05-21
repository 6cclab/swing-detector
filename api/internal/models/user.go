package models

import "time"

type User struct {
	ID              string    `gorm:"type:text;primaryKey" json:"id"`
	Email           string    `gorm:"uniqueIndex;not null" json:"email"`
	HashedPassword  string    `gorm:"column:hashed_password;not null" json:"-"`
	Name            string    `gorm:"not null" json:"name"`
	Handedness      string    `gorm:"default:right" json:"handedness"`
	Notifications   bool      `gorm:"default:true" json:"notifications"`
	CameraAngle     string    `gorm:"column:camera_angle;default:face-on" json:"camera_angle"`
	Units           string    `gorm:"default:yards" json:"units"`
	ExpoPushToken   string    `gorm:"column:expo_push_token" json:"-"`
	CreatedAt       time.Time `json:"created_at"`
}

type UserResponse struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Handedness    string `json:"handedness"`
	Notifications bool   `json:"notifications"`
	CameraAngle   string `json:"camera_angle"`
	Units         string `json:"units"`
}

type TokenResponse struct {
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	User        UserResponse `json:"user"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:            u.ID,
		Email:         u.Email,
		Name:          u.Name,
		Handedness:    u.Handedness,
		Notifications: u.Notifications,
		CameraAngle:   u.CameraAngle,
		Units:         u.Units,
	}
}
