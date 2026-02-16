/**
 * プログレスバー計算ユーティリティ
 * 残り時間から進捗パーセンテージを計算する
 */

/**
 * 進捗値を0〜100の範囲にクランプ
 * @param value - 進捗値（パーセンテージ）
 * @returns 0〜100の範囲に収まった進捗値
 */
export const clampProgress = (value: number): number => {
  // 有限数でない場合（NaN, Infinity等）は0を返す
  if (!Number.isFinite(value)) return 0;
  // 0〜100の範囲にクランプ
  return Math.min(100, Math.max(0, value));
};

/**
 * 残り秒数から進捗パーセンテージを計算
 * @param remainingSeconds - 残り秒数（nullの場合は0を返す）
 * @param totalSeconds - 総秒数（制限時間）
 * @returns 進捗パーセンテージ（0〜100）
 */
export const remainingSecondsToProgress = (
  remainingSeconds: number | null,
  totalSeconds: number
): number => {
  // 残り秒数がnull、または総秒数が0以下の場合は0を返す
  if (remainingSeconds === null || totalSeconds <= 0) return 0;
  // 残り秒数 / 総秒数 * 100 でパーセンテージ化し、0〜100にクランプ
  return clampProgress((remainingSeconds / totalSeconds) * 100);
};

