/**
 * 定数エクスポート
 * アプリケーション全体で使用する定数を集約
 */

// Languages
export {
  MAJOR_LANGUAGES,
  RARE_LANGUAGES,
  ALL_LANGUAGES,
} from './languages';
export type { MajorLanguage, RareLanguage, Language } from './languages';

// Game settings
export {
  ROUND_SECONDS,
  FEEDBACK_DELAY_MS,
  PRACTICE_ROUND_MS,
  DEFAULT_AVATAR,
  MATCH_STATUS,
} from './game';
export type { MatchStatusKey, MatchStatusValue } from './game';

// Questions
export {
  MAJOR_TEXT_FALLBACK,
  RARE_TEXT_FALLBACK,
} from './questions';
export type { FallbackQuestion } from './questions';
