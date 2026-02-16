package websocket

import (
	"encoding/json"
	"net/http"
	"strings"

	"example.com/mathkun-tmp-/server/db"
	"example.com/mathkun-tmp-/server/repositories"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// wsUpgrader はHTTP接続をWebSocketにアップグレードする設定
var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // CORS制限なし（開発用）
	},
}

// WebSocket はWebSocket接続を確立し、メッセージループを回す
func WebSocket(c *gin.Context) {
	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	// 新規クライアントを作成
	client := &client{
		id:   newClientID(),
		conn: conn,
	}

	// 接続完了を通知
	_ = conn.WriteJSON(wsMessage{Type: "welcome"})

	// メッセージ受信ループ
	for {
		var msg wsMessage
		if err := conn.ReadJSON(&msg); err != nil {
			state.RemoveClient(client)
			return
		}

		switch msg.Type {
		case "ping":
			_ = conn.WriteJSON(wsMessage{Type: "pong"})
		case "match:join":
			handleJoin(client, msg.Payload)
		case "match:answer":
			handleAnswer(client, msg.Payload)
		default:
			_ = conn.WriteJSON(wsMessage{Type: "error", Payload: mustJSON(errorPayload{Message: "unknown event"})})
		}
	}
}

// handleJoin はマッチ参加リクエストを処理する
func handleJoin(c *client, payload json.RawMessage) {
	var req joinPayload
	if err := json.Unmarshal(payload, &req); err != nil || strings.TrimSpace(req.Token) == "" {
		_ = c.conn.WriteJSON(wsMessage{Type: "error", Payload: mustJSON(errorPayload{Message: "invalid join payload"})})
		return
	}
	username, err := usernameFromToken(req.Token)
	if err != nil {
		_ = c.conn.WriteJSON(wsMessage{Type: "error", Payload: mustJSON(errorPayload{Message: "unauthorized"})})
		return
	}
	c.username = username

	// ユーザー情報（アバター画像）を取得
	if repo := repositories.NewUserRepository(db.DB); repo != nil {
		if user, err := repo.FindByUsername(username); err == nil && user != nil {
			c.imageURL = user.ImageURL
		}
	}

	// モードを確定（デフォルトは text-major）
	mode := strings.TrimSpace(req.Mode)
	if mode == "" {
		mode = "text-major"
	}
	c.mode = mode

	// マッチングキューに参加
	room, _, err := state.Join(c, mode)
	if err != nil {
		_ = c.conn.WriteJSON(wsMessage{Type: "error", Payload: mustJSON(errorPayload{Message: err.Error()})})
		return
	}

	// マッチング待機中
	if room == nil {
		_ = c.conn.WriteJSON(wsMessage{Type: "match:queued"})
		return
	}

	// マッチング成立、ゲーム開始
	startMatch(room)
}

// handleAnswer はクライアントの回答を処理する
func handleAnswer(c *client, payload json.RawMessage) {
	var req answerPayload
	if err := json.Unmarshal(payload, &req); err != nil || req.RoomID == "" {
		_ = c.conn.WriteJSON(wsMessage{Type: "error", Payload: mustJSON(errorPayload{Message: "invalid answer payload"})})
		return
	}

	room := state.GetRoom(req.RoomID)
	if room == nil {
		_ = c.conn.WriteJSON(wsMessage{Type: "error", Payload: mustJSON(errorPayload{Message: "room not found"})})
		return
	}

	processAnswer(c, room, req.Answer)
}
