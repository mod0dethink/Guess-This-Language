package repositories

import (
	"errors"

	"example.com/mathkun-tmp-/server/models"

	"gorm.io/gorm"
)

// RareQuestionRepository は珍しい言語のテキスト問題へのDB操作をまとめる
// rare_questions テーブルから取得（Georgian, Welsh, Amharic等の8言語）
type RareQuestionRepository struct {
	db *gorm.DB // GORM DBインスタンス（rare_questionsテーブル操作用）
}

// NewRareQuestionRepository はDB接続を受け取ってリポジトリを作る
// サービス層で呼ばれ、レア言語テキスト問題のDB操作を抽象化する
func NewRareQuestionRepository(db *gorm.DB) *RareQuestionRepository {
	return &RareQuestionRepository{db: db}
}

// FindRandom はランダムに1問取得する
// レア言語の練習モードで使用
func (r *RareQuestionRepository) FindRandom() (*models.RareQuestion, error) {
	var q models.RareQuestion
	// ORDER BY RAND() でランダムソート、LIMIT 1 で1件取得
	result := r.db.Order("RAND()").Limit(1).Find(&q)
	if result.Error != nil {
		// DB操作エラー（接続エラーなど）
		return nil, result.Error
	}
	// レコードが見つからなかった場合
	if errors.Is(result.Error, gorm.ErrRecordNotFound) || result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &q, nil
}

// FindRandomN はランダムにN問取得する
// レア言語のマッチモードや練習モードで複数問まとめて取得する際に使用
func (r *RareQuestionRepository) FindRandomN(count int) ([]models.RareQuestion, error) {
	// countが不正な場合は空スライスを返す
	if count <= 0 {
		return []models.RareQuestion{}, nil
	}
	var questions []models.RareQuestion
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
