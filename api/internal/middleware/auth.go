package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var publicPaths = map[string]bool{
	"/health":            true,
	"/api/auth/register": true,
	"/api/auth/login":    true,
}

func AuthMiddleware(secret []byte) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if publicPaths[c.Path()] {
			return c.Next()
		}

		auth := c.Get("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			return c.Status(401).JSON(fiber.Map{"error": "Missing or invalid token"})
		}

		tokenStr := strings.TrimPrefix(auth, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secret, nil
		})
		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		sub, _ := claims.GetSubject()
		if sub == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		c.Locals("user_id", sub)
		return c.Next()
	}
}

func GetUserID(c *fiber.Ctx) string {
	id, _ := c.Locals("user_id").(string)
	return id
}
