/**
 * カウントダウン/カウントアップフック
 * requestAnimationFrame を使用したスムーズな進行状態管理
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseCountdownOptions {
  /**
   * カウントダウンの総時間（ミリ秒）
   */
  durationMs: number;

  /**
   * カウント方向
   * - 'up': 0% → 100% (デフォルト)
   * - 'down': 100% → 0%
   */
  direction?: 'up' | 'down';

  /**
   * 自動開始するかどうか
   */
  autoStart?: boolean;

  /**
   * 完了時のコールバック
   */
  onComplete?: () => void;

  /**
   * 依存配列（この配列が変更されたときにリセット＆再開）
   */
  deps?: unknown[];
}

export interface UseCountdownReturn {
  /**
   * 現在の進行状態（0〜100のパーセンテージ）
   */
  progress: number;

  /**
   * 実行中かどうか
   */
  isRunning: boolean;

  /**
   * カウントダウンを開始
   */
  start: () => void;

  /**
   * カウントダウンを停止
   */
  stop: () => void;

  /**
   * カウントダウンをリセット
   */
  reset: () => void;
}

/**
 * スムーズなカウントダウン/カウントアップを管理するフック
 *
 * @example
 * // 5秒間のカウントアップ（0% → 100%）
 * const { progress, start } = useCountdown({
 *   durationMs: 5000,
 *   direction: 'up',
 *   onComplete: () => console.log('完了！'),
 * });
 *
 * @example
 * // 10秒間のカウントダウン（100% → 0%）、自動開始
 * const { progress } = useCountdown({
 *   durationMs: 10000,
 *   direction: 'down',
 *   autoStart: true,
 * });
 */
export function useCountdown(options: UseCountdownOptions): UseCountdownReturn {
  const {
    durationMs,
    direction = 'up',
    autoStart = false,
    onComplete,
    deps = [],
  } = options;

  const initialProgress = direction === 'down' ? 100 : 0;
  const [progress, setProgress] = useState(initialProgress);
  const [isRunning, setIsRunning] = useState(autoStart);

  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  // onComplete の最新参照を保持
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setIsRunning(false);
    startTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setProgress(initialProgress);
  }, [stop, initialProgress]);

  const start = useCallback(() => {
    stop(); // 既存のタイマーをクリア
    setIsRunning(true);
    setProgress(initialProgress);
    startTimeRef.current = null;

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const rawProgress = Math.min(100, (elapsed / durationMs) * 100);

      const currentProgress =
        direction === 'down' ? 100 - rawProgress : rawProgress;

      setProgress(currentProgress);

      // 完了チェック
      if (elapsed >= durationMs) {
        setProgress(direction === 'down' ? 0 : 100);
        setIsRunning(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [durationMs, direction, initialProgress, stop]);

  // autoStart または deps が変更されたときに自動開始
  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, ...deps]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    progress,
    isRunning,
    start,
    stop,
    reset,
  };
}
