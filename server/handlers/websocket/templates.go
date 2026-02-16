package websocket

import (
	"encoding/json"
	"errors"
	"math/rand"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var (
	placeholderRe  = regexp.MustCompile(`\{([a-zA-Z0-9_]+)\}`)
	majorTemplates []templateSet
	majorVocab     map[string][]string
	majorDataErr   error
)

// loadMajorData loads template data from JSON files
func loadMajorData() error {
	templatesPath := filepath.Join("data", "major_templates.json")
	vocabPath := filepath.Join("data", "major_vocab.json")

	templatesBytes, err := os.ReadFile(templatesPath)
	if err != nil {
		majorDataErr = err
		return err
	}

	vocabBytes, err := os.ReadFile(vocabPath)
	if err != nil {
		majorDataErr = err
		return err
	}

	var templates struct {
		Languages []struct {
			Language  string   `json:"language"`
			Templates []string `json:"templates"`
		} `json:"languages"`
	}
	if err := json.Unmarshal(templatesBytes, &templates); err != nil {
		majorDataErr = err
		return err
	}

	var vocab map[string][]string
	if err := json.Unmarshal(vocabBytes, &vocab); err != nil {
		majorDataErr = err
		return err
	}

	loadedTemplates := make([]templateSet, 0, len(templates.Languages))
	for _, entry := range templates.Languages {
		if entry.Language == "" || len(entry.Templates) == 0 {
			continue
		}
		loadedTemplates = append(loadedTemplates, templateSet{
			Language:  entry.Language,
			Templates: entry.Templates,
		})
	}

	if len(loadedTemplates) == 0 || len(vocab) == 0 {
		majorDataErr = errors.New("template data is empty")
		return majorDataErr
	}

	majorTemplates = loadedTemplates
	majorVocab = vocab
	return nil
}

// renderTemplate はテンプレート文字列を語彙で置換してレンダリングする
func renderTemplate(template string, vocab map[string][]string, rng *rand.Rand) (string, bool) {
	ok := true
	result := placeholderRe.ReplaceAllStringFunc(template, func(match string) string {
		key := strings.Trim(match, "{}")
		options := vocab[key]
		if len(options) == 0 {
			ok = false
			return match
		}
		return options[rng.Intn(len(options))]
	})
	if !ok {
		return "", false
	}
	return result, true
}

// generateQuestionsFromTemplates generates questions from loaded templates
func generateQuestionsFromTemplates(count int) ([]matchQuestion, error) {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	questions := make([]matchQuestion, 0, count)
	usedPrompts := make(map[string]bool, count)
	usedLanguages := make(map[string]bool, count)

	maxAttempts := count * 30
	for attempts := 0; attempts < maxAttempts && len(questions) < count; attempts++ {
		set := majorTemplates[rng.Intn(len(majorTemplates))]
		if len(majorTemplates) >= count && usedLanguages[set.Language] {
			continue
		}

		template := set.Templates[rng.Intn(len(set.Templates))]
		prompt, ok := renderTemplate(template, majorVocab, rng)
		if !ok {
			continue
		}
		prompt = strings.TrimSpace(prompt)
		if prompt == "" || usedPrompts[prompt] {
			continue
		}

		usedPrompts[prompt] = true
		usedLanguages[set.Language] = true
		questions = append(questions, matchQuestion{
			ID:      0,
			Prompt:  prompt,
			Answer:  set.Language,
			Choices: buildChoices(set.Language, rng),
		})
	}

	if len(questions) < count {
		return nil, errors.New("not enough template questions")
	}

	return questions, nil
}
