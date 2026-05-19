package handler

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/6cclab/swing-detector/api/internal/middleware"
	"github.com/6cclab/swing-detector/api/internal/models"
)

type AuthHandler struct {
	db        *gorm.DB
	jwtSecret []byte
}

func NewAuthHandler(db *gorm.DB, jwtSecret []byte) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: jwtSecret}
}

func (h *AuthHandler) createToken(userID string) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(h.jwtSecret)
}

type registerRequest struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	Name       string `json:"name"`
	Handedness string `json:"handedness"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var body registerRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.Email == "" || body.Password == "" || body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email, password, and name are required"})
	}

	if body.Handedness == "" {
		body.Handedness = "right"
	}

	var existing models.User
	if err := h.db.Where("email = ?", body.Email).First(&existing).Error; err == nil {
		return c.Status(409).JSON(fiber.Map{"error": "Email already registered"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 12)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	user := models.User{
		ID:             uuid.New().String(),
		Email:          strings.ToLower(body.Email),
		HashedPassword: string(hash),
		Name:           body.Name,
		Handedness:     body.Handedness,
	}

	if err := h.db.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return c.Status(409).JSON(fiber.Map{"error": "Email already registered"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
	}

	token, err := h.createToken(user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.Status(201).JSON(models.TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User:        user.ToResponse(),
	})
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var body loginRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	var user models.User
	if err := h.db.Where("email = ?", strings.ToLower(body.Email)).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(body.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token, err := h.createToken(user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.JSON(models.TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User:        user.ToResponse(),
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(user.ToResponse())
}
