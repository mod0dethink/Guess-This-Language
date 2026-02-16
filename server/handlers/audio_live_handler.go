package handlers

import (
	"bufio"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// liveAudioQuestionResponse はライブ生成音声問題のレスポンス構造
type liveAudioQuestionResponse struct {
	ID       int    `json:"id"`
	Language string `json:"language"`
	AudioURL string `json:"audioUrl"`
	Text     string `json:"text"` // デバッグ用（本番では削除可能）
}

// loadPhrases はテキストファイルからフレーズを読み込む
func loadPhrases(filePath string) ([]string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var phrases []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if len(line) > 0 {
			phrases = append(phrases, line)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return phrases, nil
}

// generateAudioWithEdgeTTS はEdge TTSを使って音声ファイルを生成する
func generateAudioWithEdgeTTS(text, voice, outputPath string) error {
	cmd := exec.Command("python3", "-m", "edge_tts",
		"--text", text,
		"--voice", voice,
		"--write-media", outputPath,
	)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("edge-tts failed: %w", err)
	}

	return nil
}

// GetLiveAudioQuestions はEdge TTSを使ってオンデマンドで音声問題を生成する
func GetLiveAudioQuestions(c *gin.Context) {
	// count パラメータを解析
	count := 5
	if raw := c.Query("count"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil {
			count = v
		}
	}
	if count < 1 {
		count = 1
	}
	if count > 20 {
		count = 20
	}

	// 現在はフランス語のみ対応
	language := "French"
	voice := "fr-FR-DeniseNeural"
	phrasesFile := "data/phrases/french.txt"

	// フレーズを読み込む
	phrases, err := loadPhrases(phrasesFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load phrases"})
		return
	}

	if len(phrases) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no phrases available"})
		return
	}

	// 乱数シードを初期化
	rand.Seed(time.Now().UnixNano())

	// ランダムにフレーズを選択
	selectedPhrases := make([]string, 0, count)
	usedIndices := make(map[int]bool)

	for len(selectedPhrases) < count && len(selectedPhrases) < len(phrases) {
		idx := rand.Intn(len(phrases))
		if !usedIndices[idx] {
			selectedPhrases = append(selectedPhrases, phrases[idx])
			usedIndices[idx] = true
		}
	}

	// 各フレーズの音声を生成
	result := make([]liveAudioQuestionResponse, 0, len(selectedPhrases))
	timestamp := time.Now().Unix()

	for i, phrase := range selectedPhrases {
		// ユニークなファイル名を生成
		filename := fmt.Sprintf("live_french_%d_%d.mp3", timestamp, i)
		outputPath := filepath.Join("public", "audio", "live", filename)

		// ディレクトリが存在することを確認
		os.MkdirAll(filepath.Join("public", "audio", "live"), 0755)

		// 音声を生成
		if err := generateAudioWithEdgeTTS(phrase, voice, outputPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to generate audio: %v", err)})
			return
		}

		result = append(result, liveAudioQuestionResponse{
			ID:       i + 1,
			Language: language,
			AudioURL: fmt.Sprintf("/audio/live/%s", filename),
			Text:     phrase,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"mode":      "major",
		"questions": result,
	})
}
