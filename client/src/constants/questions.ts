/**
 * フォールバック問題定数
 * API取得失敗時に使用するデフォルト問題
 */

/**
 * メジャー難易度のフォールバック問題（テキスト）
 */
export const MAJOR_TEXT_FALLBACK = [
  {
    prompt: 'สวัสดี',
    region: 'Region: SE Asia',
    options: ['Thai', 'Lao', 'Khmer', 'Burmese'],
  },
  {
    prompt: 'こんにちは、元気ですか？',
    region: 'Region: East Asia',
    options: ['Japanese', 'Korean', 'Chinese', 'Vietnamese'],
  },
  {
    prompt: '안녕하세요, 잘 지냈어요?',
    region: 'Region: East Asia',
    options: ['Korean', 'Japanese', 'Mongolian', 'Thai'],
  },
  {
    prompt: 'Xin chào, bạn khỏe không?',
    region: 'Region: Southeast Asia',
    options: ['Vietnamese', 'Indonesian', 'Malay', 'Tagalog'],
  },
  {
    prompt: 'မင်္ဂလာပါ',
    region: 'Region: Southeast Asia',
    options: ['Burmese', 'Khmer', 'Lao', 'Thai'],
  },
] as const;

/**
 * レア難易度のフォールバック問題（テキスト）
 */
export const RARE_TEXT_FALLBACK = [
  {
    prompt: 'Գարունը բարի է',
    region: 'Region: Eurasia',
    options: ['Armenian', 'Georgian', 'Greek', 'Hebrew'],
  },
  {
    prompt: 'שלום, מה שלומך?',
    region: 'Region: Middle East',
    options: ['Hebrew', 'Arabic', 'Persian', 'Amharic'],
  },
  {
    prompt: 'გამარჯობა',
    region: 'Region: Caucasus',
    options: ['Georgian', 'Armenian', 'Greek', 'Russian'],
  },
  {
    prompt: 'እንደምን አላችሁ',
    region: 'Region: East Africa',
    options: ['Amharic', 'Tigrinya', 'Swahili', 'Arabic'],
  },
  {
    prompt: '𐤔𐤋𐤌',
    region: 'Region: Levant',
    options: ['Phoenician', 'Hebrew', 'Aramaic', 'Greek'],
  },
] as const;

/**
 * フォールバック問題の型
 */
export type FallbackQuestion = {
  prompt: string;
  region: string;
  options: readonly string[];
};
