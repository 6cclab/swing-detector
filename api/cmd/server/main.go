package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/6cclab/swing-detector/api/internal/config"
	"github.com/6cclab/swing-detector/api/internal/database"
	"github.com/6cclab/swing-detector/api/internal/handler"
	"github.com/6cclab/swing-detector/api/internal/middleware"
	"github.com/6cclab/swing-detector/api/internal/queue"
	"github.com/6cclab/swing-detector/api/internal/storage"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	cfg := config.Load()

	db := database.Connect(cfg.DatabaseURL)

	var store storage.Storage
	if cfg.S3Endpoint != "" {
		store = storage.NewS3Storage(cfg.S3Endpoint, cfg.S3Bucket, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3Region)
		slog.Info("using S3 storage", "endpoint", cfg.S3Endpoint, "bucket", cfg.S3Bucket)
	} else {
		store = storage.NewLocalStorage(cfg.VideoStoragePath)
		slog.Info("using local storage", "path", cfg.VideoStoragePath)
	}

	q, err := queue.New(cfg.RedisURL, cfg.RedisQueue)
	if err != nil {
		slog.Error("failed to connect to redis", "err", err)
		os.Exit(1)
	}
	defer q.Close()

	authH := handler.NewAuthHandler(db, []byte(cfg.JWTSecret))
	swingH := handler.NewSwingHandler(db, store, q)
	progressH := handler.NewProgressHandler(db)
	notifyH := handler.NewNotifyHandler(db, q.Client())
	eventsH := handler.NewEventsHandler(q.Client())

	app := fiber.New(fiber.Config{
		BodyLimit: cfg.MaxUploadMB * 1024 * 1024,
	})

	app.Use(recover.New())
	app.Use(middleware.LoggingMiddleware())
	app.Use(cors.New())
	app.Use(middleware.AuthMiddleware([]byte(cfg.JWTSecret)))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/register", authH.Register)
	auth.Post("/login", authH.Login)
	auth.Get("/me", authH.Me)
	auth.Patch("/me", authH.UpdateMe)
	auth.Post("/push-token", authH.RegisterPushToken)

	swings := api.Group("/swings")
	swings.Post("/upload", swingH.Upload)
	swings.Get("/events/stream", eventsH.Stream)
	swings.Get("/", swingH.List)
	swings.Get("/:id", swingH.Get)
	swings.Delete("/:id", swingH.Delete)
	swings.Get("/:id/frames", swingH.ListFrames)
	swings.Get("/:id/frames/:phase", swingH.GetFrame)

	api.Get("/users/me/progress", progressH.GetProgress)

	internal := app.Group("/internal")
	internal.Post("/notify/swing-complete", notifyH.SwingComplete)

	go func() {
		slog.Info("starting server", "port", cfg.Port)
		if err := app.Listen(":" + cfg.Port); err != nil {
			slog.Error("server error", "err", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down")
	app.Shutdown()
}
