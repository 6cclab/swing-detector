package storage

import "io"

type Storage interface {
	SaveVideo(data []byte, ext string) (storedPath string, err error)
	SaveVideoStream(r io.Reader, ext string) (storedPath string, err error)
	ReadFrame(swingID, phase string) ([]byte, error)
	SaveFrame(swingID, phase string, data []byte) error
}
