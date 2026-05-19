package queue

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

type SwingJob struct {
	SwingID    string `json:"swing_id"`
	VideoPath  string `json:"video_path"`
	Handedness string `json:"handedness"`
	UserID     string `json:"user_id"`
}

type Queue struct {
	client    *redis.Client
	queueName string
}

func New(redisURL, queueName string) (*Queue, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}

	return &Queue{client: client, queueName: queueName}, nil
}

func (q *Queue) Publish(ctx context.Context, job SwingJob) error {
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("marshal job: %w", err)
	}
	return q.client.LPush(ctx, q.queueName, data).Err()
}

func (q *Queue) Close() error {
	return q.client.Close()
}
