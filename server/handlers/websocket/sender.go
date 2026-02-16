package websocket

import "encoding/json"

// sendRound は各プレイヤーに新ラウンドの問題を送信する
func sendRound(r *room, roundNum int, scores map[string]int) {
	for _, p := range r.players {
		if p == nil {
			continue
		}
		opponent := r.otherPlayer(p)
		payload := roundPayload{
			RoomID:           r.id,
			Opponent:         opponent.username,
			OpponentImageURL: opponent.imageURL,
			Question: questionPayload{
				ID:       r.question.ID,
				Prompt:   r.question.Prompt,
				AudioURL: r.question.AudioURL,
				Answer:   r.question.Answer,
				Choices:  r.question.Choices,
			},
			Round:       roundNum,
			TotalRounds: r.maxRounds,
			Scores:      scores,
		}

		event := "match:round"
		if roundNum == 1 {
			event = "match:started"
		}

		_ = p.conn.WriteJSON(wsMessage{Type: event, Payload: mustJSON(payload)})
	}
}

// broadcast はルーム内の全プレイヤーにメッセージを送信する
func broadcast(r *room, msg wsMessage) {
	for _, p := range r.players {
		if p != nil {
			_ = p.conn.WriteJSON(msg)
		}
	}
}

// mustJSON は値をJSON RawMessageに変換する（エラーは無視）
func mustJSON(v any) json.RawMessage {
	raw, _ := json.Marshal(v)
	return raw
}
