package websocket

// scoreSnapshot は現在のスコアのスナップショットを返す
// WebSocketメッセージでスコア状況を送信する際に使用
// 戻り値: map[username]score （例: {"alice": 3, "bob": 2}）
func (r *room) scoreSnapshot() map[string]int {
	// プレイヤー2人分のマップを作成
	snapshot := make(map[string]int, 2)
	// 各プレイヤーのユーザー名とスコアをマッピング
	for _, p := range r.players {
		if p != nil {
			// r.scores はクライアントIDをキーとしているので変換が必要
			snapshot[p.username] = r.scores[p.id]
		}
	}
	return snapshot
}

// winnerName は勝者のユーザー名を返す（引き分けの場合は空文字）
// マッチ終了時に勝者を判定し、レーティング更新や結果表示に使用
func (r *room) winnerName() string {
	// プレイヤーが2人揃っていない場合は判定不可
	if len(r.players) < 2 {
		return ""
	}
	a := r.players[0]
	b := r.players[1]
	// どちらかがnilなら判定不可
	if a == nil || b == nil {
		return ""
	}
	// 各プレイヤーのスコアを取得
	scoreA := r.scores[a.id]
	scoreB := r.scores[b.id]
	// スコアが同じなら引き分け（空文字を返す）
	if scoreA == scoreB {
		return ""
	}
	// スコアが高い方のユーザー名を返す
	if scoreA > scoreB {
		return a.username
	}
	return b.username
}

// otherPlayer は指定クライアントの対戦相手を返す
// ラウンド結果やメッセージ送信時に「相手プレイヤー」を特定するために使用
func (r *room) otherPlayer(c *client) *client {
	// プレイヤー0が引数のクライアントなら、プレイヤー1を返す
	if r.players[0] != nil && r.players[0].id == c.id {
		return r.players[1]
	}
	// プレイヤー1が引数のクライアントなら、プレイヤー0を返す
	if r.players[1] != nil && r.players[1].id == c.id {
		return r.players[0]
	}
	// どちらにも該当しない場合はnil（通常ありえない）
	return nil
}
