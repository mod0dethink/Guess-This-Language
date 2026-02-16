/**
 * ゲーム設定定数
 * タイマー、遅延、その他のゲームパラメータ
 */

/**
 * オンラインマッチのラウンド時間（秒）
 */
export const ROUND_SECONDS = 10;

/**
 * フィードバック表示後の遅延時間（ミリ秒）
 * 正解/不正解表示後、次のラウンドに進むまでの待機時間
 */
export const FEEDBACK_DELAY_MS = 1800;

/**
 * オフライン練習のラウンド時間（ミリ秒）
 */
export const PRACTICE_ROUND_MS = 8000;

/**
 * デフォルトのアバター画像URL
 */
export const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCvolPxbW7ScsUNWiA6RNV1LSWskcH6taICDRAfRDm2dOTEA9uIErleL8G1Swqr8iNp2mV8xIQecvNQy2QypDXVPtXbH-GICbvqXdUCkJd01gavIAYWyhYM64U4QP1uVbWRCELa3idE84FQAry3cTPcLsxr9Ln-O-TnVtNwQ7rSiMEx1V1oRz7Ps4qMBWXpf-qA4ODgsgDQ8T1RL5ZA-yRmGu4tkrx7jotwjnRD6IE_RCnWPURJIx1FdjcJKfC0sqiMl8tp51ZoxCw";

/**
 * マッチステータス定義
 */
export const MATCH_STATUS = {
  connecting: '接続中',
  queued: 'マッチング中',
  preparing: '準備中',
  active: '対戦中',
  finished: '対戦終了',
  closed: '切断',
  error: 'エラー',
} as const;

export type MatchStatusKey = keyof typeof MATCH_STATUS;
export type MatchStatusValue = (typeof MATCH_STATUS)[MatchStatusKey];
