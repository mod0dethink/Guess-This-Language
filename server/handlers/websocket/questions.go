package websocket

import (
	"errors"
	"strings"

	"example.com/mathkun-tmp-/server/db"
	"example.com/mathkun-tmp-/server/services"
)

// fetchAudioQuestions はマッチ用にランダムな音声問題を取得する
func fetchAudioQuestions(count int, mode string) ([]matchQuestion, error) {
	questionSvc := services.NewQuestionService(db.DB)
	dtos, err := questionSvc.GetMatchAudioQuestions(count, mode, buildAudioChoicesWithMode)
	if err != nil {
		return nil, err
	}

	// DTOを内部形式に変換
	questions := make([]matchQuestion, 0, len(dtos))
	for _, dto := range dtos {
		questions = append(questions, matchQuestion{
			ID:       dto.ID,
			Prompt:   dto.Prompt,
			Answer:   dto.Answer,
			AudioURL: dto.AudioURL,
			Choices:  dto.Choices,
		})
	}

	return questions, nil
}

// fetchFallbackQuestions はマッチ用にランダムなテキスト問題を取得する
func fetchFallbackQuestions(count int, mode string) ([]matchQuestion, error) {
	modeKey := strings.TrimSpace(mode)
	if modeKey == "" {
		modeKey = "text-major"
	}

	questionSvc := services.NewQuestionService(db.DB)
	dtos, err := questionSvc.GetMatchTextQuestions(count, modeKey, buildChoices)
	if err != nil {
		return nil, err
	}

	// DTOを内部形式に変換
	questions := make([]matchQuestion, 0, len(dtos))
	for _, dto := range dtos {
		questions = append(questions, matchQuestion{
			ID:      dto.ID,
			Prompt:  dto.Prompt,
			Answer:  dto.Answer,
			Choices: dto.Choices,
		})
	}

	return questions, nil
}

// generateMajorQuestions はテンプレートから問題を生成する（レガシー/未使用？）
func generateMajorQuestions(count int) ([]matchQuestion, error) {
	if count <= 0 {
		return nil, errors.New("invalid question count")
	}

	if majorDataErr != nil {
		return nil, majorDataErr
	}
	if len(majorTemplates) == 0 || len(majorVocab) == 0 {
		if err := loadMajorData(); err != nil {
			return nil, err
		}
	}

	return generateQuestionsFromTemplates(count)
}
