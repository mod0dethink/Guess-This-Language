package handlers

import (
	"github.com/gin-gonic/gin"
)

// GetRandomAudioQuestions はランダムな音声問題を取得する
func GetRandomAudioQuestions(c *gin.Context) {
	params := ParseQuestionParams(c)

	questions, err := questionService.GetAudioQuestions(params.Count, params.Mode)
	if err != nil {
		RespondWithError(c, "failed to load audio questions")
		return
	}

	RespondWithQuestions(c, questions, params.Mode)
}
