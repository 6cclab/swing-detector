package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

type LocalStorage struct {
	root string
}

func NewLocalStorage(root string) *LocalStorage {
	os.MkdirAll(root, 0o755)
	return &LocalStorage{root: root}
}

func (s *LocalStorage) SaveVideo(data []byte, ext string) (string, error) {
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	path := filepath.Join(s.root, filename)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return "", fmt.Errorf("save video: %w", err)
	}
	return path, nil
}

func (s *LocalStorage) SaveVideoStream(r io.Reader, ext string) (string, error) {
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	path := filepath.Join(s.root, filename)
	f, err := os.Create(path)
	if err != nil {
		return "", fmt.Errorf("create video file: %w", err)
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		os.Remove(path)
		return "", fmt.Errorf("write video stream: %w", err)
	}
	return path, nil
}

func (s *LocalStorage) SaveFrame(swingID, phase string, data []byte) error {
	dir := filepath.Join(s.root, swingID)
	os.MkdirAll(dir, 0o755)
	return os.WriteFile(filepath.Join(dir, fmt.Sprintf("%s.jpg", phase)), data, 0o644)
}

func (s *LocalStorage) ReadFrame(swingID, phase string) ([]byte, error) {
	path := filepath.Join(s.root, swingID, fmt.Sprintf("%s.jpg", phase))
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read frame: %w", err)
	}
	return data, nil
}
