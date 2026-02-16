package router

import (
	"example.com/mathkun-tmp-/server/handlers"
	"github.com/gin-gonic/gin"
)

// 増えてきたらここでルーティングをまとめて他はわける
func SetupRouter(r *gin.Engine) {
	SetupUserRoutes(r)
	SetupWebSocketRoutes(r)
	SetupQuestionRoutes(r)
	r.GET("/leaderboard", handlers.GetLeaderboard)
}
