package websocket

import (
	"errors"
	"math"

	"example.com/mathkun-tmp-/server/db"
	"example.com/mathkun-tmp-/server/repositories"
	"gorm.io/gorm"
)

// eloKFactor はEloレーティング計算のK因子
// 32はチェスで一般的な値で、レーティング変動をほどよい幅に保つ
const eloKFactor = 32.0

// ratingResult はレーティング更新結果を保持する構造体
type ratingResult struct {
	Ratings map[string]int // 更新後のレーティング（username → 新レーティング）
	Deltas  map[string]int // レーティング変動量（username → 増減値）
}

// applyEloForMatch はマッチ結果に基づいてEloレーティングを更新する
// 勝者のレーティングが上がり、敗者のレーティングが下がる
// レーティング差が大きいほど変動幅も小さくなる（強者が弱者に勝っても少ししか上がらない）
func applyEloForMatch(r *room, winner string) (ratingResult, error) {
	// 結果を格納する構造体を初期化
	result := ratingResult{
		Ratings: map[string]int{},
		Deltas:  map[string]int{},
	}
	// ルームまたは勝者情報が無効な場合は何もしない
	if r == nil || winner == "" {
		return result, nil
	}
	// プレイヤーが2人揃っていない場合も何もしない
	if r.players[0] == nil || r.players[1] == nil {
		return result, nil
	}
	// 両プレイヤーのユーザー名を取得
	userA := r.players[0].username
	userB := r.players[1].username
	// どちらかのユーザー名が空なら処理しない
	if userA == "" || userB == "" {
		return result, nil
	}

	// DB更新をトランザクション内で実行（途中エラー時は全てロールバック）
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		// リポジトリを作成してユーザー情報を取得
		repo := repositories.NewUserRepository(tx)
		uA, err := repo.FindByUsername(userA)
		if err != nil || uA == nil {
			return err
		}
		uB, err := repo.FindByUsername(userB)
		if err != nil || uB == nil {
			return err
		}

		// 現在のレーティングを取得（計算用にfloat64に変換）
		ra := float64(uA.Rating)
		rb := float64(uB.Rating)
		// Eloの期待勝率を計算
		// ea: プレイヤーAの期待勝率（0.0〜1.0）
		// 例: Aが1600、Bが1400なら ea ≈ 0.76（Aが76%の確率で勝つ）
		ea := 1.0 / (1.0 + math.Pow(10, (rb-ra)/400.0))
		eb := 1.0 - ea // Bの期待勝率（1 - ea）

		// 実際の結果スコアを設定
		var sa, sb float64
		if winner == userA {
			// Aが勝った場合: sa=1（勝利）, sb=0（敗北）
			sa, sb = 1, 0
			uA.Wins++   // Aの勝利数をインクリメント
			uB.Losses++ // Bの敗北数をインクリメント
		} else if winner == userB {
			// Bが勝った場合: sa=0（敗北）, sb=1（勝利）
			sa, sb = 0, 1
			uB.Wins++   // Bの勝利数をインクリメント
			uA.Losses++ // Aの敗北数をインクリメント
		} else {
			// 勝者が見つからない場合はエラー
			return errors.New("winner not found")
		}

		// Eloレーティングの更新式: 新レーティング = 旧レーティング + K因子 × (実際の結果 - 期待勝率)
		// 例: Aが期待通り勝った（ea=0.76, sa=1）なら +32×(1-0.76) = +7.68点
		// 例: Aが番狂わせで勝った（ea=0.24, sa=1）なら +32×(1-0.24) = +24.32点
		newRa := int(math.Round(ra + eloKFactor*(sa-ea)))
		newRb := int(math.Round(rb + eloKFactor*(sb-eb)))
		// 結果構造体に新レーティングを格納
		result.Ratings[userA] = newRa
		result.Ratings[userB] = newRb
		// レーティング変動量も計算して格納（+20, -15 など）
		result.Deltas[userA] = newRa - uA.Rating
		result.Deltas[userB] = newRb - uB.Rating
		// DBに新レーティングと勝敗数を書き込む
		if err := repo.UpdateRatingByUsername(userA, newRa, uA.Wins, uA.Losses); err != nil {
			return err
		}
		if err := repo.UpdateRatingByUsername(userB, newRb, uB.Wins, uB.Losses); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return result, err
	}
	return result, nil
}
