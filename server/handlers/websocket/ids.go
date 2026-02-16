package websocket

import (
	"strconv"
	"sync/atomic"
)

// グローバルカウンタ（ID生成用）
// マルチゴルーチン環境で安全にインクリメントするためatomic型を使用
var (
	nextClientID uint64 // クライアントID用のカウンタ（1, 2, 3...）
	nextRoomID   uint64 // ルームID用のカウンタ（1, 2, 3...）
)

// newClientID はユニークなクライアントIDを生成する
// 戻り値: "c-1", "c-2", "c-3" のような形式のID文字列
func newClientID() string {
	// atomicにインクリメントして新しいIDを取得（スレッドセーフ）
	id := atomic.AddUint64(&nextClientID, 1)
	// "c-" プレフィックスをつけて文字列化（例: "c-123"）
	return "c-" + strconv.FormatUint(id, 10)
}

// newRoomID はユニークなルームIDを生成する
// 戻り値: "r-1", "r-2", "r-3" のような形式のID文字列
func newRoomID() string {
	// atomicにインクリメントして新しいIDを取得（スレッドセーフ）
	id := atomic.AddUint64(&nextRoomID, 1)
	// "r-" プレフィックスをつけて文字列化（例: "r-456"）
	return "r-" + strconv.FormatUint(id, 10)
}
