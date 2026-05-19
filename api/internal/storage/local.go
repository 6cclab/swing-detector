package storage

import (
	"fmt"
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

func (s *LocalStorage) ReadFrame(swingID, phase string) ([]byte, error) {
	path := filepath.Join(s.root, swingID, fmt.Sprintf("%s.jpg", phase))
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read frame: %w", err)
	}
	return data, nil
}
