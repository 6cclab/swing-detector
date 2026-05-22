package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type S3Storage struct {
	client *s3.Client
	bucket string
}

func NewS3Storage(endpoint, bucket, accessKey, secretKey, region string) *S3Storage {
	if region == "" {
		region = "garage"
	}
	client := s3.New(s3.Options{
		BaseEndpoint: &endpoint,
		Region:       region,
		Credentials:  credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		UsePathStyle: true,
	})
	return &S3Storage{client: client, bucket: bucket}
}

func (s *S3Storage) SaveVideo(data []byte, ext string) (string, error) {
	return s.SaveVideoStream(bytes.NewReader(data), ext)
}

func (s *S3Storage) SaveVideoStream(r io.Reader, ext string) (string, error) {
	key := fmt.Sprintf("videos/%s%s", uuid.New().String(), ext)
	_, err := s.client.PutObject(context.Background(), &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        r,
		ContentType: aws.String("video/mp4"),
	})
	if err != nil {
		return "", fmt.Errorf("s3 put video: %w", err)
	}
	return key, nil
}

func (s *S3Storage) SaveFrame(swingID, phase string, data []byte) error {
	key := fmt.Sprintf("frames/%s/%s.jpg", swingID, phase)
	_, err := s.client.PutObject(context.Background(), &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        bytes.NewReader(data),
		ContentType: aws.String("image/jpeg"),
	})
	if err != nil {
		return fmt.Errorf("s3 put frame: %w", err)
	}
	return nil
}

func (s *S3Storage) ReadFrame(swingID, phase string) ([]byte, error) {
	key := fmt.Sprintf("frames/%s/%s.jpg", swingID, phase)
	out, err := s.client.GetObject(context.Background(), &s3.GetObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
	})
	if err != nil {
		return nil, fmt.Errorf("s3 get frame: %w", err)
	}
	defer out.Body.Close()
	return io.ReadAll(out.Body)
}

func (s *S3Storage) GetVideoURL(key string) string {
	return fmt.Sprintf("s3://%s/%s", s.bucket, key)
}
