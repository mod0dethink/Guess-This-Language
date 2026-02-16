package websocket

import (
	"errors"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type userClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func usernameFromToken(tokenString string) (string, error) {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		return "", errors.New("jwt secret not configured")
	}

	claims := &userClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}
	if strings.TrimSpace(claims.Username) == "" {
		return "", errors.New("missing username")
	}
	return claims.Username, nil
}
