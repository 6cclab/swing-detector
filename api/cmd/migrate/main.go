package main

import (
	"flag"
	"log/slog"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	direction := flag.String("direction", "up", "Migration direction: up or down")
	steps := flag.Int("steps", 0, "Number of steps (0 = all)")
	dbURL := flag.String("db", "", "Database URL (overrides DATABASE_URL env)")
	migrationsPath := flag.String("path", "file://migrations", "Path to migration files")
	flag.Parse()

	dsn := *dbURL
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	m, err := migrate.New(*migrationsPath, dsn)
	if err != nil {
		slog.Error("failed to create migrator", "err", err)
		os.Exit(1)
	}
	defer m.Close()

	switch *direction {
	case "up":
		if *steps > 0 {
			err = m.Steps(*steps)
		} else {
			err = m.Up()
		}
	case "down":
		if *steps > 0 {
			err = m.Steps(-*steps)
		} else {
			err = m.Down()
		}
	case "version":
		v, dirty, verr := m.Version()
		if verr != nil {
			slog.Error("failed to get version", "err", verr)
			os.Exit(1)
		}
		slog.Info("current version", "version", v, "dirty", dirty)
		return
	default:
		slog.Error("invalid direction, use 'up', 'down', or 'version'")
		os.Exit(1)
	}

	if err != nil && err != migrate.ErrNoChange {
		slog.Error("migration failed", "err", err)
		os.Exit(1)
	}

	v, _, _ := m.Version()
	slog.Info("migration complete", "direction", *direction, "version", v)
}
