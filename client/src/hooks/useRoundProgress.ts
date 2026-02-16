/**
 * ラウンド進捗フック
 * 対戦モードやオフライン練習モードの各ラウンドの制限時間を管理
 * requestAnimationFrameを使用してスムーズな進捗バーを表示
 */

import { useEffect, useRef, useState } from 'react';
import { clampProgress } from '../lib/progress';

/**
 * useRoundProgressのオプション型
 */
type UseRoundProgressOptions = {
  durationMs: number;      // ラウンドの制限時間（ミリ秒）
  running: boolean;        // カウントダウン実行中かどうか
  resetKey: number | string;  // この値が変わるとリセット&再開
  onComplete: () => void;  // 制限時間終了時のコールバック
};

/**
 * useRoundProgressの戻り値型
 */
type UseRoundProgressReturn = {
  progress: number;  // 残り時間の進捗（0〜100、100が満タン、0が時間切れ）
};

/**
 * ラウンド進捗を管理するフック
 * 100%から0%にカウントダウンし、0%に到達したらonCompleteを呼ぶ
 * @param options - 制限時間、実行状態、リセットキー、完了コールバック
 * @returns 現在の進捗パーセンテージ（100〜0）
 */
export function useRoundProgress({
  durationMs,
  running,
  resetKey,
  onComplete,
}: UseRoundProgressOptions): UseRoundProgressReturn {
  // 現在の進捗状態（100〜0）
  const [progress, setProgress] = useState(0);
  // requestAnimationFrameのID保存用
  const rafRef = useRef<number | null>(null);
  // onCompleteの最新参照を保持
  const onCompleteRef = useRef(onComplete);

  // onCompleteの最新参照を更新
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // カウントダウン処理
  useEffect(() => {
    // 既存のアニメーションをキャンセル
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // 実行中でない、または制限時間が0以下の場合は進捗を0にして終了
    if (!running || durationMs <= 0) {
      setProgress(0);
      return;
    }

    // カウントダウン開始時刻（ミリ秒）
    let startedAt = 0;

    // アニメーションフレームごとに呼ばれる関数
    const tick = (now: number) => {
      // 初回実行時は開始時刻を記録し、進捗を100%にセット
      if (startedAt === 0) {
        startedAt = now;
        setProgress(100);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // 経過時間を計算
      const elapsed = now - startedAt;
      // 残り時間の割合を計算（1.0〜0.0）
      const remainingRatio = Math.max(0, 1 - elapsed / durationMs);
      // パーセンテージに変換して進捗にセット
      const nextProgress = clampProgress(remainingRatio * 100);
      setProgress(nextProgress);

      // 制限時間に到達したら完了コールバックを呼ぶ
      if (elapsed >= durationMs) {
        setProgress(0);
        onCompleteRef.current();
        return;
      }

      // 次のフレームを予約
      rafRef.current = requestAnimationFrame(tick);
    };

    // アニメーション開始
    rafRef.current = requestAnimationFrame(tick);

    // クリーンアップ: アンマウント時にアニメーションをキャンセル
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [durationMs, running, resetKey]);

  return { progress };
}

