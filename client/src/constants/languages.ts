/**
 * 言語リスト定数
 * メジャー言語とレア言語の定義
 */

/**
 * メジャー言語（13言語）
 * オーディオ問題とテキスト問題で使用
 */
export const MAJOR_LANGUAGES = [
  'English',
  'Spanish',
  'Japanese',
  'Korean',
  'Chinese',
  'German',
  'Italian',
  'Arabic',
  'Indonesian',
  'Hindi',
  'Russian',
  'Turkish',
  'French',
] as const;

/**
 * レア言語（8言語）
 * 難易度の高い問題で使用
 */
export const RARE_LANGUAGES = [
  'Georgian',
  'Amharic',
  'Welsh',
  'Icelandic',
  'Khmer',
  'Sinhala',
  'Maltese',
  'Mongolian',
] as const;

/**
 * 全言語リスト
 */
export const ALL_LANGUAGES = [...MAJOR_LANGUAGES, ...RARE_LANGUAGES] as const;

/**
 * 言語タイプ
 */
export type MajorLanguage = (typeof MAJOR_LANGUAGES)[number];
export type RareLanguage = (typeof RARE_LANGUAGES)[number];
export type Language = (typeof ALL_LANGUAGES)[number];
