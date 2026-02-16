package websocket

import (
	"math/rand"
	"strings"
)

// buildAudioChoices は音声問題用の選択肢を生成する（メジャーモード）
func buildAudioChoices(correct string, rng *rand.Rand) []string {
	return buildAudioChoicesWithMode(correct, rng, "major")
}

// buildAudioChoicesWithMode はモード別に音声問題用の選択肢を生成する
func buildAudioChoicesWithMode(correct string, rng *rand.Rand, mode string) []string {
	// モードに応じて言語プールを選択
	var languagePool []string
	if mode == "rare" {
		languagePool = audioRareLanguages
	} else {
		languagePool = audioMajorLanguages
	}

	candidates := make([]string, 0, len(languagePool))
	for _, lang := range languagePool {
		if strings.TrimSpace(lang) != "" {
			candidates = append(candidates, lang)
		}
	}
	unique := make(map[string]struct{}, len(candidates)+1)
	choices := make([]string, 0, 4)
	if strings.TrimSpace(correct) != "" {
		choices = append(choices, correct)
		unique[correct] = struct{}{}
	}

	for len(choices) < 4 && len(candidates) > 0 {
		cand := candidates[rng.Intn(len(candidates))]
		if _, exists := unique[cand]; exists {
			continue
		}
		unique[cand] = struct{}{}
		choices = append(choices, cand)
	}

	rng.Shuffle(len(choices), func(i, j int) {
		choices[i], choices[j] = choices[j], choices[i]
	})

	return choices
}

// buildChoices はテキスト問題用の選択肢を生成する
func buildChoices(correct string, rng *rand.Rand) []string {
	candidates := make([]string, 0, len(majorTemplates)+len(fallbackLanguages))
	if len(majorTemplates) > 0 {
		for _, t := range majorTemplates {
			if t.Language != "" {
				candidates = append(candidates, t.Language)
			}
		}
	}
	if len(candidates) == 0 {
		candidates = append(candidates, fallbackLanguages...)
	}

	unique := make(map[string]struct{}, len(candidates)+1)
	choices := make([]string, 0, 4)
	if strings.TrimSpace(correct) != "" {
		choices = append(choices, correct)
		unique[correct] = struct{}{}
	}

	for len(choices) < 4 && len(candidates) > 0 {
		cand := candidates[rng.Intn(len(candidates))]
		if _, exists := unique[cand]; exists {
			continue
		}
		unique[cand] = struct{}{}
		choices = append(choices, cand)
	}

	rng.Shuffle(len(choices), func(i, j int) {
		choices[i], choices[j] = choices[j], choices[i]
	})

	return choices
}
