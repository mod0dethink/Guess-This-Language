package services

import (
	"errors"

	"example.com/mathkun-tmp-/server/models"
	"example.com/mathkun-tmp-/server/repositories"
	"gorm.io/gorm"
)

// UserDTO はユーザープロフィール情報を返すDTO
// REST APIのレスポンスとして使用
type UserDTO struct {
	Username string `json:"username"` // ユーザー名（一意）
	ImageURL string `json:"imageUrl"` // プロフィール画像のURL
	Bio      string `json:"bio"`      // 自己紹介文
	Rating   int    `json:"rating"`   // Eloレーティング（初期値1500）
}

// UserRankDTO はユーザーの順位情報を返すDTO
// レーティングと順位、試合数をまとめて返す
type UserRankDTO struct {
	Rating     int  `json:"rating"`              // 現在のレーティング
	MatchCount int  `json:"matchCount"`          // 総試合数（勝ち+負け）
	Rank       *int `json:"rank,omitempty"`      // 全体順位（試合数が足りない場合はnil）
}

// ProfileUpdateDTO はプロフィール更新時に受け取るデータ
// ポインタ型にすることで「送られてこなかった」と「空文字で更新」を区別する
type ProfileUpdateDTO struct {
	ImageURL *string // 画像URL（nullならこのフィールドは更新しない）
	Bio      *string // 自己紹介（nullならこのフィールドは更新しない）
}

// UserService はユーザー関連のビジネスロジックをまとめる
type UserService struct {
	userRepo *repositories.UserRepository
}

// NewUserService は依存するリポジトリを組み立ててサービスを返す
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		userRepo: repositories.NewUserRepository(db),
	}
}

// GetUserProfile はログイン中のユーザー情報を取得する
// JWT認証後のユーザー名を使ってDBから情報を引き出す
func (s *UserService) GetUserProfile(username string) (*UserDTO, error) {
	// DBからユーザー情報を検索
	user, err := s.userRepo.FindByUsername(username)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	// モデルをDTOに変換して返す
	return &UserDTO{
		Username: user.Username,
		ImageURL: user.ImageURL,
		Bio:      user.Bio,
		Rating:   user.Rating,
	}, nil
}

// GetUserRank はユーザーの全体順位を取得する
// 一定数以上の試合をこなしていない場合、順位は返さない（初心者保護）
func (s *UserService) GetUserRank(username string) (*UserRankDTO, error) {
	// DBからユーザー情報を検索
	user, err := s.userRepo.FindByUsername(username)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	// 自分より上のレーティング人数を数える
	// 例: 自分のレーティングが1520で、1521以上のユーザーが99人なら、自分は100位
	higherCount, err := s.userRepo.CountHigherRating(user.Rating)
	if err != nil {
		return nil, err
	}

	// 総試合数を計算（勝ち数 + 負け数）
	matchCount := user.Wins + user.Losses
	// 基本情報をDTOに詰める
	result := &UserRankDTO{
		Rating:     user.Rating,
		MatchCount: matchCount,
	}

	// 最低試合数に達していれば順位を表示（初心者には順位を表示しない）
	if matchCount >= repositories.MinRankedMatches {
		// 順位 = 上位人数 + 1（例: 上に99人いれば100位）
		rank := int(higherCount + 1) // int64からintに変換
		result.Rank = &rank           // ポインタで渡す（nilとの区別のため）
	}

	return result, nil
}

// GetPublicProfile は公開プロフィール情報を取得する
// 他のユーザーのプロフィールを閲覧する際に使用（ログイン不要）
func (s *UserService) GetPublicProfile(username string) (*UserDTO, error) {
	// DBからユーザー情報を検索
	user, err := s.userRepo.FindByUsername(username)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	// 公開情報（username, imageURL, bio, rating）をDTOに詰めて返す
	return &UserDTO{
		Username: user.Username,
		ImageURL: user.ImageURL,
		Bio:      user.Bio,
		Rating:   user.Rating,
	}, nil
}

// UpdateAvatar はプロフィール画像だけを更新する
// 画像URLのみの更新専用メソッド
func (s *UserService) UpdateAvatar(username, imageURL string) error {
	// リポジトリ経由でDBの image_url カラムを更新
	return s.userRepo.UpdateImageByUsername(username, imageURL)
}

// UpdateProfile はプロフィール（画像やBio）をまとめて更新する
// 送られてきたフィールドだけを部分更新する（PATCH方式）
func (s *UserService) UpdateProfile(username string, updates ProfileUpdateDTO) error {
	// まずユーザーが存在するか確認
	user, err := s.userRepo.FindByUsername(username)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	// 送られてきたフィールドだけマップに詰める
	// nullでないフィールドのみ更新対象とする
	updateMap := make(map[string]any)
	if updates.ImageURL != nil {
		// 画像URLが送られてきたら更新対象に追加
		updateMap["image_url"] = *updates.ImageURL
	}
	if updates.Bio != nil {
		// 自己紹介が送られてきたら更新対象に追加
		updateMap["bio"] = *updates.Bio
	}

	// マップをリポジトリに渡して部分更新を実行
	return s.userRepo.UpdateProfileByUsername(username, updateMap)
}

// GetUserByUsername はユーザー情報を取得するヘルパー
// 内部的に他のサービスやハンドラから呼ばれることもある
func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	// リポジトリ経由でユーザーモデルを返す（DTO変換なし）
	return s.userRepo.FindByUsername(username)
}
