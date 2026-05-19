package storage

type Storage interface {
	SaveVideo(data []byte, ext string) (storedPath string, err error)
	ReadFrame(swingID, phase string) ([]byte, error)
}
