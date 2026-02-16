/**
 * 音声再生フック
 * HTMLAudioElement の再生管理を簡素化
 */

import { useRef, useState, useCallback, useEffect } from 'react';

export interface UseAudioPlayerOptions {
  /**
   * 音声再生が終了したときのコールバック
   */
  onEnded?: () => void;

  /**
   * 音声再生でエラーが発生したときのコールバック
   */
  onError?: () => void;

  /**
   * 音声再生が開始されたときのコールバック
   */
  onPlay?: () => void;

  /**
   * ベースURL（相対URLを絶対URLに変換するため）
   */
  baseUrl?: string;
}

export interface UseAudioPlayerReturn {
  /**
   * audio 要素への参照
   */
  audioRef: React.RefObject<HTMLAudioElement | null>;

  /**
   * 音声を再生
   * @param url - 音声ファイルのURL（相対パスまたは絶対パス）
   */
  play: (url: string) => Promise<void>;

  /**
   * 音声を一時停止
   */
  pause: () => void;

  /**
   * 音声を停止（一時停止 + 先頭に戻す）
   */
  stop: () => void;

  /**
   * 現在再生中かどうか
   */
  isPlaying: boolean;

  /**
   * エラーが発生したかどうか
   */
  hasError: boolean;

  /**
   * 現在の再生位置（秒）
   */
  currentTime: number;

  /**
   * 音声の長さ（秒）
   */
  duration: number;
}

/**
 * 音声再生を管理するフック
 *
 * @example
 * const { audioRef, play, pause, isPlaying } = useAudioPlayer({
 *   onEnded: () => console.log('再生終了'),
 *   onError: () => console.log('エラー発生'),
 * });
 *
 * // JSX内で
 * <audio ref={audioRef} />
 * <button onClick={() => play('/audio/sample.mp3')}>再生</button>
 */
export function useAudioPlayer(
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn {
  const { onEnded, onError, onPlay, baseUrl } = options;

  const audioRef = useRef<HTMLAudioElement>(null);
  const boundAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // コールバックの最新参照を保持
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const onPlayRef = useRef(onPlay);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
    onPlayRef.current = onPlay;
  }, [onEnded, onError, onPlay]);

  // URL解決（相対URLを絶対URLに変換）
  const resolveUrl = useCallback(
    (url: string): string => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      const base = baseUrl || 'http://localhost:8000';
      return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    },
    [baseUrl]
  );

  // 音声再生
  const play = useCallback(
    async (url: string): Promise<void> => {
      if (!audioRef.current) {
        console.warn('audioRef is not initialized');
        return;
      }

      const audio = audioRef.current;
      const resolvedUrl = resolveUrl(url);

      // リセット
      audio.pause();
      audio.currentTime = 0;
      setHasError(false);

      // 新しいURLをセット
      if (audio.src !== resolvedUrl) {
        audio.src = resolvedUrl;
        audio.load();
      }

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // ignore abort caused by immediate replay/stop transitions
          return;
        }
        console.error('Failed to play audio:', err);
        setHasError(true);
        setIsPlaying(false);
        if (onErrorRef.current) {
          onErrorRef.current();
        }
      }
    },
    [resolveUrl]
  );

  // 音声一時停止
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // 音声停止（一時停止 + 先頭に戻す）
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  // イベントハンドラーのセットアップ
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || boundAudioRef.current === audio) return;
    boundAudioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlayRef.current) {
        onPlayRef.current();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      setHasError(true);
      if (onErrorRef.current) {
        onErrorRef.current();
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (boundAudioRef.current === audio) {
        boundAudioRef.current = null;
      }
    };
  });

  return {
    audioRef,
    play,
    pause,
    stop,
    isPlaying,
    hasError,
    currentTime,
    duration,
  };
}
