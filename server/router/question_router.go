package router

import (
	"example.com/mathkun-tmp-/server/handlers"

	"github.com/gin-gonic/gin"
)

func SetupQuestionRoutes(r *gin.Engine) {
	r.GET("/questions", handlers.GetRandomQuestions)
	r.GET("/api/audio/questions", handlers.GetRandomAudioQuestions)
}
