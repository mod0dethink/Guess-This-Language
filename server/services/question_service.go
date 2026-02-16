package services

import (
	"errors"
	"math/rand"
	"time"

	"example.com/mathkun-tmp-/server/models"
	"example.com/mathkun-tmp-/server/repositories"
	"gorm.io/gorm"
)

// QuestionDTO はREST APIで返すテキスト問題のデータ構造
type QuestionDTO struct {
	ID     uint   `json:"id"`
	Prompt string `json:"prompt"` // 問題文（例: "Hello, how are you?"）
	Answer string `json:"answer"` // 正解の言語名（例: "English"）
}

// AudioQuestionDTO はREST APIで返す音声問題のデータ構造
type AudioQuestionDTO struct {
	ID       uint   `json:"id"`
	Language string `json:"language"` // 音声の言語名
	AudioURL string `json:"audioUrl"` // 音声ファイルのパス
}

// MatchQuestionDTO はWebSocketマッチで使う問題データ（選択肢付き）
type MatchQuestionDTO struct {
	ID       uint     `json:"id"`
	Prompt   string   `json:"prompt"`
	Answer   string   `json:"answer"`
	AudioURL string   `json:"audioUrl,omitempty"`
	Choices  []string `json:"choices"` // 4択の選択肢（正解含む）
}

// QuestionService は問題取得のビジネスロジックをまとめる
type QuestionService struct {
	db             *gorm.DB
	majorTextRepo  *repositories.QuestionRepository       // メジャー言語テキスト（13言語）
	rareTextRepo   *repositories.RareQuestionRepository   // レア言語テキスト（8言語）
	audioRepo      *repositories.AudioQuestionRepository  // 音声問題（両方）
}

// NewQuestionService は依存するリポジトリを組み立ててサービスを返す
func NewQuestionService(db *gorm.DB) *QuestionService {
	return &QuestionService{
		db:             db,
		majorTextRepo:  repositories.NewQuestionRepository(db),
		rareTextRepo:   repositories.NewRareQuestionRepository(db),
		audioRepo:      repositories.NewAudioQuestionRepository(db),
	}
}

// GetTextQuestions はREST API用にランダムなテキスト問題を取得する
// modeが "rare" なら珍しい言語、それ以外はメジャー言語の問題を返す
func (s *QuestionService) GetTextQuestions(count int, mode string) ([]QuestionDTO, error) {
	// 問題数のバリデーション
	if count <= 0 {
		return nil, errors.New("invalid question count")
	}

	var questions []QuestionDTO

	if mode == "rare" {
		// レア言語モード（Georgian, Amharic, Welsh等）
		rows, err := s.rareTextRepo.FindRandomN(count)
		if err != nil {
			return nil, err
		}
		// モデルをDTOに変換
		questions = make([]QuestionDTO, 0, len(rows))
		for _, q := range rows {
			questions = append(questions, QuestionDTO{
				ID:     q.ID,
				Prompt: q.Prompt,
				Answer: q.Answer,
			})
		}
	} else {
		// デフォルトはメジャー言語（English, Spanish, Japanese等）
		rows, err := s.majorTextRepo.FindRandomN(count)
		if err != nil {
			return nil, err
		}
		// モデルをDTOに変換
		questions = make([]QuestionDTO, 0, len(rows))
		for _, q := range rows {
			questions = append(questions, QuestionDTO{
				ID:     q.ID,
				Prompt: q.Prompt,
				Answer: q.Answer,
			})
		}
	}

	return questions, nil
}

// GetAudioQuestions はREST API用にランダムな音声問題を取得する
// modeが "rare" なら珍しい言語、それ以外はメジャー言語の音声を返す
func (s *QuestionService) GetAudioQuestions(count int, mode string) ([]AudioQuestionDTO, error) {
	// 問題数のバリデーション
	if count <= 0 {
		return nil, errors.New("invalid question count")
	}

	var questions []AudioQuestionDTO

	if mode == "rare" {
		// レア言語の音声問題を取得
		rows, err := s.audioRepo.FindRandomNRare(count)
		if err != nil {
			return nil, err
		}
		// モデルをDTOに変換（AudioURLはEdge TTSで生成済み）
		questions = make([]AudioQuestionDTO, 0, len(rows))
		for _, q := range rows {
			questions = append(questions, AudioQuestionDTO{
				ID:       q.ID,
				Language: q.Language,
				AudioURL: q.AudioURL,
			})
		}
	} else {
		// デフォルトはメジャー言語の音声問題
		rows, err := s.audioRepo.FindRandomN(count)
		if err != nil {
			return nil, err
		}
		// モデルをDTOに変換
		questions = make([]AudioQuestionDTO, 0, len(rows))
		for _, q := range rows {
			questions = append(questions, AudioQuestionDTO{
				ID:       q.ID,
				Language: q.Language,
				AudioURL: q.AudioURL,
			})
		}
	}

	return questions, nil
}

// GetMatchTextQuestions はWebSocketマッチ用に選択肢付きテキスト問題を取得する
// buildChoicesFn で選択肢を生成し、ランダムシャッフルも行う
func (s *QuestionService) GetMatchTextQuestions(count int, mode string, buildChoicesFn func(string, *rand.Rand) []string) ([]MatchQuestionDTO, error) {
	// 問題数のバリデーション
	if count <= 0 {
		return nil, errors.New("invalid question count")
	}

	// 選択肢生成用の乱数ジェネレータを作成
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	questions := make([]MatchQuestionDTO, 0, count)

	if mode == "text-rare" {
		// レア言語のテキスト問題を取得
		rows, err := s.rareTextRepo.FindRandomN(count)
		if err != nil {
			return nil, err
		}
		if len(rows) == 0 {
			return nil, errors.New("no rare questions found")
		}
		// 各問題に4択の選択肢を付与
		for _, q := range rows {
			questions = append(questions, MatchQuestionDTO{
				ID:      q.ID,
				Prompt:  q.Prompt,
				Answer:  q.Answer,
				Choices: buildChoicesFn(q.Answer, rng), // 正解を含む4択を生成
			})
		}
	} else {
		// text-major または未指定の場合
		rows, err := s.majorTextRepo.FindRandomN(count)
		if err != nil {
			return nil, err
		}
		if len(rows) == 0 {
			return nil, errors.New("no questions found")
		}
		// 各問題に4択の選択肢を付与
		for _, q := range rows {
			questions = append(questions, MatchQuestionDTO{
				ID:      q.ID,
				Prompt:  q.Prompt,
				Answer:  q.Answer,
				Choices: buildChoicesFn(q.Answer, rng), // 正解を含む4択を生成
			})
		}
	}

	return questions, nil
}

// GetMatchAudioQuestions はWebSocketマッチ用に選択肢付き音声問題を取得する
// audio-rare なら珍しい言語、それ以外はメジャー言語の音声を返す
func (s *QuestionService) GetMatchAudioQuestions(count int, mode string, buildChoicesFn func(string, *rand.Rand, string) []string) ([]MatchQuestionDTO, error) {
	// 問題数のバリデーション
	if count <= 0 {
		return nil, errors.New("invalid question count")
	}

	// 選択肢生成用の乱数ジェネレータを作成
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	questions := make([]MatchQuestionDTO, 0, count)

	var choiceMode string
	if mode == "audio-rare" {
		// レア言語モード：8言語の中から選択肢を生成
		choiceMode = "rare"
		rows, err := s.audioRepo.FindRandomNRare(count)
		if err != nil {
			return nil, err
		}
		if len(rows) == 0 {
			return nil, errors.New("no rare audio questions")
		}
		// 各音声問題に選択肢を付与
		for _, row := range rows {
			questions = append(questions, MatchQuestionDTO{
				ID:       row.ID,
				Prompt:   "", // 音声問題はプロンプトなし（音声のみ）
				Answer:   row.Language,
				AudioURL: row.AudioURL,
				Choices:  buildChoicesFn(row.Language, rng, choiceMode), // レア言語プールから4択
			})
		}
	} else {
		// audio-major または未指定：13言語の中から選択肢を生成
		choiceMode = "major"
		rows, err := s.audioRepo.FindRandomN(count)
		if err != nil {
			return nil, err
		}
		if len(rows) == 0 {
			return nil, errors.New("no audio questions")
		}
		// 各音声問題に選択肢を付与
		for _, row := range rows {
			questions = append(questions, MatchQuestionDTO{
				ID:       row.ID,
				Prompt:   "", // 音声問題はプロンプトなし（音声のみ）
				Answer:   row.Language,
				AudioURL: row.AudioURL,
				Choices:  buildChoicesFn(row.Language, rng, choiceMode), // メジャー言語プールから4択
			})
		}
	}

	return questions, nil
}

// convertQuestionToDTO はモデルをDTOに変換（メジャーテキスト）
func convertQuestionToDTO(q models.Question) QuestionDTO {
	return QuestionDTO{
		ID:     q.ID,
		Prompt: q.Prompt,
		Answer: q.Answer,
	}
}

// convertRareQuestionToDTO はモデルをDTOに変換（レアテキスト）
func convertRareQuestionToDTO(q models.RareQuestion) QuestionDTO {
	return QuestionDTO{
		ID:     q.ID,
		Prompt: q.Prompt,
		Answer: q.Answer,
	}
}

// convertAudioQuestionToDTO はモデルをDTOに変換（メジャー音声）
func convertAudioQuestionToDTO(q models.AudioQuestion) AudioQuestionDTO {
	return AudioQuestionDTO{
		ID:       q.ID,
		Language: q.Language,
		AudioURL: q.AudioURL,
	}
}

// convertRareAudioQuestionToDTO はモデルをDTOに変換（レア音声）
func convertRareAudioQuestionToDTO(q models.RareAudioQuestion) AudioQuestionDTO {
	return AudioQuestionDTO{
		ID:       q.ID,
		Language: q.Language,
		AudioURL: q.AudioURL,
	}
}
