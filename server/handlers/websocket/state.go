package websocket

// state はマッチング状態を管理するグローバル変数
var state = &matchState{
	waiting: make(map[string]*client),
	rooms:   make(map[string]*room),
}

// Join はクライアントをマッチングキューに参加させる
func (s *matchState) Join(c *client, mode string) (*room, *client, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := mode
	if key == "" {
		key = "text-major"
	}

	if waiting, ok := s.waiting[key]; !ok || waiting == nil {
		s.waiting[key] = c
		return nil, nil, nil
	}

	if s.waiting[key].id == c.id {
		return nil, nil, nil
	}

	opponent := s.waiting[key]
	if opponent != nil && opponent.username != "" && opponent.username == c.username {
		s.waiting[key] = c
		return nil, nil, nil
	}
	s.waiting[key] = nil

	roomID := newRoomID()
	r := &room{
		id:      roomID,
		players: [2]*client{opponent, c},
		mode:    key,
	}
	opponent.roomID = roomID
	c.roomID = roomID
	s.rooms[roomID] = r

	return r, opponent, nil
}

// GetRoom は指定IDのルームを取得する
func (s *matchState) GetRoom(roomID string) *room {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.rooms[roomID]
}

// RemoveRoom は指定IDのルームを削除する
func (s *matchState) RemoveRoom(roomID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.rooms, roomID)
}

// RemoveClient はクライアントを待機キューまたはルームから削除する
func (s *matchState) RemoveClient(c *client) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if c.mode != "" {
		if waiting, ok := s.waiting[c.mode]; ok && waiting != nil && waiting.id == c.id {
			s.waiting[c.mode] = nil
			return
		}
	}

	room, ok := s.rooms[c.roomID]
	if !ok {
		return
	}

	delete(s.rooms, c.roomID)

	other := room.otherPlayer(c)
	if other != nil {
		_ = other.conn.WriteJSON(wsMessage{Type: "match:ended", Payload: mustJSON(finishedPayload{
			RoomID: room.id,
			Scores: room.scoreSnapshot(),
			Status: "opponent_left",
		})})
		other.roomID = ""
	}
}
