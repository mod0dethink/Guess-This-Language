package router

import (
	"example.com/mathkun-tmp-/server/handlers"
	"github.com/gin-gonic/gin"
)

// 増えてきたらここでルーティングをまとめて他はわける
func SetupUserRoutes(r *gin.Engine) {
	r.POST("/signup", handlers.SignUp)
	r.POST("/login", handlers.Login)
	r.GET("/users/me", handlers.GetMe)
	r.GET("/users/me/rank", handlers.GetMyRank)
	r.GET("/users/:username", handlers.GetUserPublic)
	r.PATCH("/users/me/avatar", handlers.UpdateAvatar)
	r.PATCH("/users/me/profile", handlers.UpdateProfile)
}
