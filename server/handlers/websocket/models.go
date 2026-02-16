package websocket

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// マッチングの定数
const (
	maxRoundsPerMatch = 3                // 1試合あたりのラウンド数
	roundDuration     = 10 * time.Second // 1ラウンドの制限時間
)

// wsMessage はWebSocketメッセージの共通フォーマット
type wsMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// joinPayload はマッチ参加リクエストのペイロード
type joinPayload struct {
	Token string `json:"token"`
	Mode  string `json:"mode"`
}

// answerPayload はクライアントの回答を受け取るペイロード
type answerPayload struct {
	RoomID string `json:"roomId"`
	Answer string `json:"answer"`
}

// roundPayload は新ラウンド開始時にクライアントへ送る情報
type roundPayload struct {
	RoomID           string          `json:"roomId"`
	Opponent         string          `json:"opponent"`
	OpponentImageURL string          `json:"opponentImageUrl,omitempty"`
	Question         questionPayload `json:"question"`
	Round            int             `json:"round"`
	TotalRounds      int             `json:"totalRounds"`
	Scores           map[string]int  `json:"scores"`
}

// questionPayload は問題データを送信する構造
type questionPayload struct {
	ID      uint     `json:"id"`
	Prompt  string   `json:"prompt"`
	AudioURL string  `json:"audioUrl,omitempty"`
	Answer  string   `json:"answer,omitempty"`    // デバッグ用（本番では送らない）
	Choices []string `json:"choices,omitempty"`
}

// resultPayload はラウンド終了時の結果を送る構造
type resultPayload struct {
	RoomID   string         `json:"roomId"`
	Status   string         `json:"status"`
	Round    int            `json:"round"`
	Scores   map[string]int `json:"scores"`
	Answers  map[string]string `json:"answers,omitempty"`
	Correct  map[string]bool   `json:"correct,omitempty"`
	Answer   string            `json:"answer,omitempty"`
}

// finishedPayload はマッチ終了時の最終結果を送る構造
type finishedPayload struct {
	RoomID string         `json:"roomId"`
	Winner string         `json:"winner,omitempty"` // 勝者がいれば設定
	Scores map[string]int `json:"scores"`
	Status string         `json:"status"` // "victory", "defeat", "draw"
	Recap  []recapItem    `json:"recap,omitempty"`
	Ratings map[string]int `json:"ratings,omitempty"` // 更新後のレーティング
	Deltas  map[string]int `json:"deltas,omitempty"`  // レーティング変動
}

// recapItem はラウンドごとの振り返り情報
type recapItem struct {
	Round  string `json:"round"`
	Prompt string `json:"prompt"`
	Winner string `json:"winner,omitempty"`
	Status string `json:"status"`
}

// errorPayload はエラーメッセージを送る構造
type errorPayload struct {
	Message string `json:"message"`
}

// preparingPayload はマッチ準備中を通知する構造
type preparingPayload struct {
	Status string `json:"status"`
}

// matchQuestion はマッチで使う問題データの内部表現
type matchQuestion struct {
	ID      uint
	Prompt  string
	Answer  string
	AudioURL string
	Choices []string
}

// templateSet はテンプレート生成用の言語とテンプレートリスト
type templateSet struct {
	Language  string
	Templates []string
}

// client は接続中のクライアント情報
type client struct {
	id       string
	username string
	imageURL string
	conn     *websocket.Conn
	roomID   string
	mode     string
}

// room はマッチングルーム（2人対戦）
type room struct {
	id        string
	players   [2]*client
	questions []matchQuestion
	question  *matchQuestion
	answers   map[string]string
	round     int
	maxRounds int
	scores    map[string]int
	active    bool
	finished  bool
	roundSeq  uint64
	recap     []recapItem
	mode      string
	mu        sync.Mutex // ルーム内の排他制御
}

// matchState はマッチング全体の状態管理
type matchState struct {
	mu      sync.Mutex
	waiting map[string]*client // マッチング待機中のクライアント
	rooms   map[string]*room   // 進行中のルーム
}
