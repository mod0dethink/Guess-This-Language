package handlers

import (
	"example.com/mathkun-tmp-/server/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// questionService はグローバルで使う問題サービス
// InitHandlers() で初期化される
var questionService *services.QuestionService

// InitHandlers はハンドラーで使うサービスを初期化する
// main.go の db.Init() の後に呼ぶ必要がある
func InitHandlers(db *gorm.DB) {
	questionService = services.NewQuestionService(db)
}

// GetRandomQuestions はランダムなテキスト問題を取得する
func GetRandomQuestions(c *gin.Context) {
	params := ParseQuestionParams(c)

	questions, err := questionService.GetTextQuestions(params.Count, params.Mode)
	if err != nil {
		RespondWithError(c, "failed to load questions")
		return
	}

	RespondWithQuestions(c, questions, "")
}
