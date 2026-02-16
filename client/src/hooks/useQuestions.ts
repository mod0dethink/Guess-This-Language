/**
 * 問題取得フック
 * テキスト問題・音声問題の取得とローディング状態管理
 */

import { useEffect, useState } from 'react';
import { getTextQuestions, getAudioQuestions } from '../api';
import type { Question, AudioQuestion, DifficultyLevel } from '../types';

export interface UseTextQuestionsOptions {
  /**
   * 問題数
   */
  count?: number;

  /**
   * 難易度モード
   */
  mode?: DifficultyLevel;

  /**
   * フォールバック問題（APIエラー時に使用）
   */
  fallback?: Question[];
}

export interface UseTextQuestionsReturn {
  /**
   * 取得した問題リスト
   */
  questions: Question[];

  /**
   * ローディング中かどうか
   */
  isLoading: boolean;

  /**
   * エラーが発生したかどうか
   */
  hasError: boolean;
}

export interface UseAudioQuestionsOptions {
  /**
   * 問題数
   */
  count?: number;

  /**
   * 難易度モード
   */
  mode?: DifficultyLevel;
}

export interface UseAudioQuestionsReturn {
  /**
   * 取得した問題リスト
   */
  questions: AudioQuestion[];

  /**
   * ローディング中かどうか
   */
  isLoading: boolean;

  /**
   * エラーが発生したかどうか
   */
  hasError: boolean;
}

/**
 * テキスト問題を取得するフック
 *
 * @example
 * const { questions, isLoading, hasError } = useTextQuestions({
 *   count: 5,
 *   mode: 'major',
 *   fallback: FALLBACK_QUESTIONS,
 * });
 */
export function useTextQuestions(
  options: UseTextQuestionsOptions = {}
): UseTextQuestionsReturn {
  const { count = 5, mode, fallback = [] } = options;

  const [questions, setQuestions] = useState<Question[]>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setHasError(false);

    getTextQuestions(count, mode)
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        } else if (fallback.length > 0) {
          // APIから問題が返されなかった場合、フォールバックを使用
          setQuestions(fallback);
        }
      })
      .catch((error) => {
        console.error('Failed to load text questions:', error);
        setHasError(true);
        // エラー時はフォールバックを使用
        if (fallback.length > 0) {
          setQuestions(fallback);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [count, mode, fallback]);

  return {
    questions,
    isLoading,
    hasError,
  };
}

/**
 * 音声問題を取得するフック
 *
 * @example
 * const { questions, isLoading, hasError } = useAudioQuestions({
 *   count: 5,
 *   mode: 'major',
 * });
 */
export function useAudioQuestions(
  options: UseAudioQuestionsOptions = {}
): UseAudioQuestionsReturn {
  const { count = 5, mode } = options;

  const [questions, setQuestions] = useState<AudioQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setHasError(false);

    getAudioQuestions(count, mode)
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      })
      .catch((error) => {
        console.error('Failed to load audio questions:', error);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [count, mode]);

  return {
    questions,
    isLoading,
    hasError,
  };
}
