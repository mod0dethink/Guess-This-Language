/**
 * カスタムフック
 * 再利用可能なロジックをフックとしてエクスポート
 */

export { useCountdown } from './useCountdown';
export type { UseCountdownOptions, UseCountdownReturn } from './useCountdown';
export { useRoundProgress } from './useRoundProgress';

export { useAudioPlayer } from './useAudioPlayer';
export type { UseAudioPlayerOptions, UseAudioPlayerReturn } from './useAudioPlayer';

export { useTextQuestions, useAudioQuestions } from './useQuestions';
export type {
  UseTextQuestionsOptions,
  UseTextQuestionsReturn,
  UseAudioQuestionsOptions,
  UseAudioQuestionsReturn,
} from './useQuestions';
