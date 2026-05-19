package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	VideoStoragePath string
	MaxUploadMB      int
	RedisURL         string
	RedisQueue       string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	maxUpload := 500
	if v := os.Getenv("MAX_UPLOAD_MB"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			maxUpload = n
		}
	}

	storagePath := os.Getenv("VIDEO_STORAGE_PATH")
	if storagePath == "" {
		storagePath = "./uploads"
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	redisQueue := os.Getenv("REDIS_QUEUE")
	if redisQueue == "" {
		redisQueue = "swing:analyze"
	}

	return &Config{
		Port:             port,
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		JWTSecret:        os.Getenv("SECRET_KEY"),
		VideoStoragePath: storagePath,
		MaxUploadMB:      maxUpload,
		RedisURL:         redisURL,
		RedisQueue:       redisQueue,
	}
}
