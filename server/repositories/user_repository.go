package repositories

import (
	"errors"

	"example.com/mathkun-tmp-/server/models"

	"gorm.io/gorm"
)

// UserRepository はユーザーデータへのDB操作をまとめる
// ユーザーの作成、検索、更新などの基本的なCRUD操作を提供
type UserRepository struct {
	db *gorm.DB // GORM DBインスタンス（usersテーブル操作用）
}

// NewUserRepository はDB接続を受け取ってリポジトリを作る
// サービス層やハンドラ層で呼ばれ、DB操作を抽象化する
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create は新規ユーザーをDBに保存する
// usersテーブルに INSERT を実行（ID は自動採番）
func (r *UserRepository) Create(user *models.User) error {
	// GORM の Create メソッドでINSERT実行
	return r.db.Create(user).Error
}

// FindByUsername はユーザー名でユーザーを検索する（見つからなければnil）
// ログイン認証や情報取得で頻繁に使われる
func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	// WHERE username = ? で検索、First は最初の1件を取得
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		// レコードが見つからない場合は nil を返す（エラーではない）
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		// その他のエラー（DB接続エラーなど）はそのまま返す
		return nil, err
	}
	return &user, nil
}

// UpdateImageByUsername はユーザーのアバター画像を更新する
// image_url カラムのみを更新（他のフィールドはそのまま）
func (r *UserRepository) UpdateImageByUsername(username, imageURL string) error {
	// UpdateProfileByUsername を使って部分更新
	return r.UpdateProfileByUsername(username, map[string]any{
		"image_url": imageURL,
	})
}

// UpdateProfileByUsername はプロフィール情報を部分更新する
// map で指定されたカラムのみを更新（PATCH方式）
func (r *UserRepository) UpdateProfileByUsername(username string, updates map[string]any) error {
	// 更新するフィールドがない場合は何もしない
	if len(updates) == 0 {
		return nil
	}
	// Model で対象テーブルを指定、Where でユーザーを特定、Updates で部分更新
	// 例: Updates({"image_url": "...", "bio": "..."}) → image_url と bio だけ更新
	return r.db.Model(&models.User{}).
		Where("username = ?", username).
		Updates(updates).
		Error
}

// UpdateRatingByUsername はレーティングと勝敗数を更新する
// マッチ終了時にElo計算結果を反映するために使う
func (r *UserRepository) UpdateRatingByUsername(username string, rating, wins, losses int) error {
	// rating, wins, losses の3カラムを同時に更新
	return r.db.Model(&models.User{}).
		Where("username = ?", username).
		Updates(map[string]any{
			"rating": rating,  // 新しいレーティング
			"wins":   wins,    // 更新後の勝利数
			"losses": losses,  // 更新後の敗北数
		}).
		Error
}

// MinRankedMatches はランキングに表示される最低試合数
// この試合数に満たないユーザーは順位が表示されない（初心者保護）
const MinRankedMatches = 5

// FindTopByRating はレーティング上位のユーザーを取得する
// リーダーボード画面で使用（試合数条件を満たすユーザーのみ）
func (r *UserRepository) FindTopByRating(limit int) ([]models.User, error) {
	// limitが不正な場合はデフォルトで30人にする
	if limit <= 0 {
		limit = 30
	}
	var users []models.User
	// WHERE wins + losses >= 5（最低試合数条件）
	// ORDER BY rating DESC（レーティング降順でソート）
	// LIMIT で取得件数を制限
	if err := r.db.Where("wins + losses >= ?", MinRankedMatches).Order("rating DESC").Limit(limit).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// CountHigherRating は自分より高いレーティングを持つユーザー数を返す
// 順位計算に使用（例: 上に99人いれば自分は100位）
func (r *UserRepository) CountHigherRating(rating int) (int64, error) {
	var count int64
	// WHERE rating > 自分のレーティング AND wins + losses >= 5
	// 試合数条件を満たす、自分より強いユーザーの数を数える
	if err := r.db.Model(&models.User{}).
		Where("rating > ? AND wins + losses >= ?", rating, MinRankedMatches).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
