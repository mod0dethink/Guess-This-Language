package websocket

import (
	"math/rand"
	"strings"
	"time"
)

// processAnswer はクライアントの回答を処理し、記録する
func processAnswer(c *client, r *room, answer string) {
	r.mu.Lock()
	if r.finished || !r.active || r.question == nil {
		r.mu.Unlock()
		_ = c.conn.WriteJSON(wsMessage{Type: "match:result", Payload: mustJSON(resultPayload{
			RoomID: r.id,
			Status: "closed",
		})})
		return
	}

	if r.answers == nil {
		r.answers = map[string]string{}
	}
	if _, exists := r.answers[c.id]; exists {
		round := r.round
		scores := r.scoreSnapshot()
		r.mu.Unlock()
		_ = c.conn.WriteJSON(wsMessage{Type: "match:result", Payload: mustJSON(resultPayload{
			RoomID: r.id,
			Status: "locked",
			Round:  round,
			Scores: scores,
		})})
		return
	}

	r.answers[c.id] = answer
	r.mu.Unlock()
}

// startMatch はマッチを開始し、問題を生成する
func startMatch(r *room) {
	broadcast(r, wsMessage{Type: "match:preparing", Payload: mustJSON(preparingPayload{Status: "generating"})})

	var (
		questions []matchQuestion
		err       error
	)
	if strings.HasPrefix(r.mode, "audio-") {
		questions, err = fetchAudioQuestions(maxRoundsPerMatch, r.mode)
	} else {
		questions, err = fetchFallbackQuestions(maxRoundsPerMatch, r.mode)
	}
	if err != nil {
		broadcast(r, wsMessage{Type: "match:finished", Payload: mustJSON(finishedPayload{
			RoomID: r.id,
			Scores: r.scoreSnapshot(),
			Status: "no_questions",
		})})
		state.RemoveRoom(r.id)
		return
	}

	r.mu.Lock()
	r.maxRounds = len(questions)
	r.questions = questions
	r.scores = map[string]int{
		r.players[0].id: 0,
		r.players[1].id: 0,
	}
	r.mu.Unlock()

	startRound(r)
}

// startRound は新しいラウンドを開始し、問題を配信する
func startRound(r *room) {
	r.mu.Lock()
	if r.finished || r.active {
		r.mu.Unlock()
		return
	}
	if r.round >= r.maxRounds || r.round >= len(r.questions) {
		r.mu.Unlock()
		finishMatch(r, "completed")
		return
	}

	nextIndex := r.round
	r.round++
	r.question = &r.questions[nextIndex]
	if len(r.question.Choices) == 0 {
		r.question.Choices = buildChoices(r.question.Answer, rand.New(rand.NewSource(time.Now().UnixNano())))
	}
	r.answers = map[string]string{}
	r.active = true
	r.roundSeq++
	roundSeq := r.roundSeq
	roundNum := r.round
	scores := r.scoreSnapshot()
	r.mu.Unlock()

	sendRound(r, roundNum, scores)

	roundLimit := roundDuration
	if strings.HasPrefix(r.mode, "audio-") {
		roundLimit = 15 * time.Second
	}
	time.AfterFunc(roundLimit, func() {
		handleTimeout(r, roundSeq)
	})
}

// handleTimeout はラウンドのタイムアウトを処理し、結果を送信する
func handleTimeout(r *room, seq uint64) {
	r.mu.Lock()
	if r.finished || !r.active || r.roundSeq != seq {
		r.mu.Unlock()
		return
	}
	r.active = false
	round := r.round
	prompt := ""
	answer := ""
	if r.question != nil {
		prompt = r.question.Prompt
		answer = r.question.Answer
		if prompt == "" && answer != "" {
			prompt = answer
		}
	}

	answers := map[string]string{}
	correct := map[string]bool{}
	for _, p := range r.players {
		if p == nil {
			continue
		}
		choice, ok := r.answers[p.id]
		if ok {
			answers[p.username] = choice
		}
		isCorrect := ok && choice == answer
		if isCorrect {
			r.scores[p.id]++
		}
		correct[p.username] = isCorrect
	}

	scores := r.scoreSnapshot()
	r.mu.Unlock()

	broadcast(r, wsMessage{Type: "match:result", Payload: mustJSON(resultPayload{
		RoomID:  r.id,
		Status:  "round_end",
		Round:   round,
		Scores:  scores,
		Answers: answers,
		Correct: correct,
		Answer:  answer,
	})})

	recordRecap(r, round, prompt, "round_end", "")
	continueOrFinish(r)
}

// continueOrFinish は次のラウンドに進むか、マッチを終了するか判定する
func continueOrFinish(r *room) {
	r.mu.Lock()
	finished := r.round >= r.maxRounds
	r.mu.Unlock()

	if finished {
		finishMatch(r, "completed")
		return
	}

	if strings.HasPrefix(r.mode, "audio-") {
		time.AfterFunc(1800*time.Millisecond, func() {
			startRound(r)
		})
		return
	}
	startRound(r)
}

// finishMatch はマッチを終了し、最終結果とレーティング変動を送信する
func finishMatch(r *room, status string) {
	r.mu.Lock()
	if r.finished {
		r.mu.Unlock()
		return
	}
	r.finished = true
	scores := r.scoreSnapshot()
	winner := r.winnerName()
	recap := r.recap
	r.mu.Unlock()

	ratingResult := ratingResult{}
	if winner != "" {
		if rr, err := applyEloForMatch(r, winner); err == nil {
			ratingResult = rr
		}
	}

	broadcast(r, wsMessage{Type: "match:finished", Payload: mustJSON(finishedPayload{
		RoomID: r.id,
		Winner: winner,
		Scores: scores,
		Status: status,
		Recap:  recap,
		Ratings: ratingResult.Ratings,
		Deltas:  ratingResult.Deltas,
	})})

	state.RemoveRoom(r.id)
}
