package repositories

import (
	"errors"

	"example.com/mathkun-tmp-/server/models"

	"gorm.io/gorm"
)

// ErrQuestionNotFound は問題が見つからなかった場合のエラー
// テーブルが空の場合などに返される
var ErrQuestionNotFound = errors.New("question not found")

// QuestionRepository はメジャー言語のテキスト問題へのDB操作をまとめる
// questions テーブルから取得（English, Spanish, Japanese等の13言語）
type QuestionRepository struct {
	db *gorm.DB // GORM DBインスタンス（questionsテーブル操作用）
}

// NewQuestionRepository はDB接続を受け取ってリポジトリを作る
// サービス層で呼ばれ、テキスト問題のDB操作を抽象化する
func NewQuestionRepository(db *gorm.DB) *QuestionRepository {
	return &QuestionRepository{db: db}
}

// FindRandom はランダムに1問取得する
// 練習モードやクイック対戦で使用
func (r *QuestionRepository) FindRandom() (*models.Question, error) {
	var question models.Question
	// ORDER BY RAND() でランダムソート、LIMIT 1 で1件取得
	result := r.db.Order("RAND()").Limit(1).Find(&question)
	if result.Error != nil {
		// DB操作エラー（接続エラーなど）
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		// テーブルが空で問題が見つからなかった
		return nil, ErrQuestionNotFound
	}
	return &question, nil
}

// FindRandomN はランダムにN問取得する
// マッチモードや練習モードで複数問まとめて取得する際に使用
func (r *QuestionRepository) FindRandomN(count int) ([]models.Question, error) {
	// countが不正な場合は空スライスを返す
	if count <= 0 {
		return []models.Question{}, nil
	}
	var questions []models.Question
	// ORDER BY RAND() でランダムソート、LIMIT count で指定件数取得
	result := r.db.Order("RAND()").Limit(count).Find(&questions)
	if result.Error != nil {
		// DB操作エラー（接続エラーなど）
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		// テーブルが空で問題が見つからなかった
		return nil, ErrQuestionNotFound
	}
	return questions, nil
}
