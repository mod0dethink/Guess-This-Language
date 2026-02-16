package repositories

import (
	"example.com/mathkun-tmp-/server/models"
	"gorm.io/gorm"
)

// AudioQuestionRepository は音声問題へのDB操作をまとめる
// メジャー言語（13言語）とレア言語（8言語）の両方の音声問題を扱う
type AudioQuestionRepository struct {
	db *gorm.DB // GORM DBインスタンス（DB操作用）
}

// NewAudioQuestionRepository はDB接続を受け取ってリポジトリを作る
// サービス層で呼ばれ、DB操作を抽象化する
func NewAudioQuestionRepository(db *gorm.DB) *AudioQuestionRepository {
	return &AudioQuestionRepository{db: db}
}

// FindRandomN はメジャー言語の音声問題をランダムにN問取得する
// audio_questions テーブルから取得（English, Spanish, Japanese等の13言語）
func (r *AudioQuestionRepository) FindRandomN(limit int) ([]models.AudioQuestion, error) {
	// limitが不正な場合はデフォルトで5問にする
	if limit <= 0 {
		limit = 5
	}
	// 結果を格納するスライス
	var questions []models.AudioQuestion
	// ORDER BY RAND() でランダムソート、LIMIT で件数制限
	// MySQLの RAND() を使用（PostgreSQLなら RANDOM() になる）
	if err := r.db.Order("RAND()").Limit(limit).Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

// FindRandomNRare は珍しい言語の音声問題をランダムにN問取得する
// rare_audio_questions テーブルから取得（Georgian, Welsh, Amharic等の8言語）
func (r *AudioQuestionRepository) FindRandomNRare(limit int) ([]models.RareAudioQuestion, error) {
	// limitが不正な場合はデフォルトで5問にする
	if limit <= 0 {
		limit = 5
	}
	// 結果を格納するスライス
	var questions []models.RareAudioQuestion
	// ORDER BY RAND() でランダムソート、LIMIT で件数制限
	// レア言語テーブルから取得
	if err := r.db.Order("RAND()").Limit(limit).Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}
