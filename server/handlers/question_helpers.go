package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// QuestionParams は問題取得エンドポイントの共通パラメータ
type QuestionParams struct {
	Count int
	Mode  string
}

// ParseQuestionParams はクエリパラメータを抽出・検証する
// count: 1-20 (デフォルト: 5)
// mode: "major" または "rare" (デフォルト: "major")
func ParseQuestionParams(c *gin.Context) QuestionParams {
	count := 5
	if raw := c.Query("count"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil {
			count = v
		}
	}
	if count < 1 {
		count = 1
	}
	if count > 20 {
		count = 20
	}

	mode := strings.TrimSpace(c.Query("mode"))
	if mode == "" {
		mode = "major"
	}

	return QuestionParams{
		Count: count,
		Mode:  mode,
	}
}

// RespondWithQuestions は統一されたJSON形式で問題を返す
func RespondWithQuestions(c *gin.Context, questions interface{}, mode string) {
	response := gin.H{"questions": questions}
	if mode != "" {
		response["mode"] = mode
	}
	c.JSON(http.StatusOK, response)
}

// RespondWithError は統一されたエラーレスポンスを返す
func RespondWithError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, gin.H{"error": message})
}
