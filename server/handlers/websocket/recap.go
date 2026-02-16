package websocket

import "fmt"

// recordRecap はラウンド結果を振り返り用に記録する
// マッチ終了後にクライアントへ全ラウンドの結果を送信するために使う
func recordRecap(r *room, round int, prompt, status, winner string) {
	// ルームが無効な場合は何もしない
	if r == nil {
		return
	}
	// 共有データへのアクセスなのでロックを取得
	r.mu.Lock()
	defer r.mu.Unlock()
	// ラウンド番号が無効なら記録しない
	if round <= 0 {
		return
	}
	// ラウンド番号を2桁フォーマットに変換（例: 1 → "01", 10 → "10"）
	label := fmt.Sprintf("%02d", round)
	// 同じラウンドが既に記録されていないかチェック（重複防止）
	for _, item := range r.recap {
		if item.Round == label {
			return // 既に記録済みなら何もしない
		}
	}
	// 新しいラウンド結果を作成
	recap := recapItem{
		Round:  label,         // ラウンド番号（"01", "02"...）
		Prompt: prompt,        // 出題された問題文または音声URL
		Winner: winner,        // このラウンドの勝者ユーザー名
		Status: status,        // "correct", "incorrect", "timeout" など
	}
	// ルームの記録リストに追加
	r.recap = append(r.recap, recap)
}
