package main

import (
	"example.com/mathkun-tmp-/server/db"
	"example.com/mathkun-tmp-/server/handlers"
	"example.com/mathkun-tmp-/server/models"
	"example.com/mathkun-tmp-/server/router"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		panic("Failed to load .env file")
	}
}

func main() {
	// 1. DB初期化
	db.Init()
	db.DB.AutoMigrate(
		&models.User{},
		&models.Question{},
		&models.RareQuestion{},
		&models.AudioQuestion{},
	)

	// 2. ハンドラーのサービス初期化（DB接続後に実行）
	handlers.InitHandlers(db.DB)

	// 3. ルーター設定
	r := gin.Default()
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}
	r.Use(cors.New(config))
	r.Static("/audio", "public/audio")
	router.SetupRouter(r)
	r.Run(":8000")
}
