/**
 * 問題API
 * テキスト問題・音声問題の取得
 */

import { apiFetch } from './client';
import type {
  QuestionsResponse,
  AudioQuestionsResponse,
  DifficultyLevel,
} from '../types';

/**
 * テキスト問題を取得
 */
export async function getTextQuestions(
  count: number = 5,
  mode?: DifficultyLevel
): Promise<QuestionsResponse> {
  const modeParam = mode ? `&mode=${mode}` : '';
  return apiFetch<QuestionsResponse>(`/questions?count=${count}${modeParam}`);
}

/**
 * 音声問題を取得
 */
export async function getAudioQuestions(
  count: number = 5,
  mode?: DifficultyLevel
): Promise<AudioQuestionsResponse> {
  const modeParam = mode ? `&mode=${mode}` : '';
  return apiFetch<AudioQuestionsResponse>(
    `/api/audio/questions?count=${count}${modeParam}`
  );
}
