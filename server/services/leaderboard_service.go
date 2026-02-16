package services

import (
	"gorm.io/gorm"

	"example.com/mathkun-tmp-/server/repositories"
)

// LeaderboardRowDTO はランキング表示用の行データ
// フロントエンドのリーダーボード画面で1行分の表示に使う
type LeaderboardRowDTO struct {
	Rank     int    `json:"rank"`     // 順位（1位、2位...）
	Username string `json:"username"` // ユーザー名
	Rating   int    `json:"rating"`   // Eloレーティング
	ImageURL string `json:"imageUrl"` // プロフィール画像URL
}

// LeaderboardService はランキング関連のビジネスロジックをまとめる
// 上位プレイヤーの取得、検索などを担当
type LeaderboardService struct {
	userRepo *repositories.UserRepository // ユーザーリポジトリ（DB操作）
}

// NewLeaderboardService は依存するリポジトリを組み立ててサービスを返す
// DB接続を受け取ってサービスインスタンスを初期化
func NewLeaderboardService(db *gorm.DB) *LeaderboardService {
	return &LeaderboardService{
		userRepo: repositories.NewUserRepository(db),
	}
}

// GetTopPlayers はレーティング上位のプレイヤーを取得する
// limit は 1〜100 の範囲で指定可能（それ以外の値は自動補正）
func (s *LeaderboardService) GetTopPlayers(limit int) ([]LeaderboardRowDTO, error) {
	// リミット値を安全な範囲に調整（最小1、最大100）
	// 負の数や0が送られてきたら1にする
	if limit < 1 {
		limit = 1
	}
	// 100を超える値が送られてきたら100にする（DB負荷対策）
	if limit > 100 {
		limit = 100
	}

	// リポジトリ経由でレーティング降順にユーザーを取得
	// 例: limit=10 なら上位10人が返ってくる
	users, err := s.userRepo.FindTopByRating(limit)
	if err != nil {
		return nil, err
	}

	// 順位を付けてDTOに詰める
	// 配列のインデックスを使って順位を生成（0番目が1位）
	rows := make([]LeaderboardRowDTO, 0, len(users))
	for i, u := range users {
		rows = append(rows, LeaderboardRowDTO{
			Rank:     i + 1,        // インデックス0→順位1、インデックス1→順位2...
			Username: u.Username,   // ユーザー名
			Rating:   u.Rating,     // レーティング
			ImageURL: u.ImageURL,   // プロフィール画像
		})
	}

	return rows, nil
}
