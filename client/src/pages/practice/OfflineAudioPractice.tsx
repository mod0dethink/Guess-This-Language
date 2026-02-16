/**
 * オフライン音声練習ページコンポーネント
 * ソロプレイで音声形式の言語当て問題に挑戦
 * メジャー言語またはレア言語を選択可能
 * 5問出題され、各問題8秒の制限時間あり
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from '../../lib/profile';
import { useAudioPlayer, useAudioQuestions, useRoundProgress } from '../../hooks';
import ProgressBar from '../../components/ProgressBar';
import {
  MAJOR_LANGUAGES,
  RARE_LANGUAGES,
  FEEDBACK_DELAY_MS,
  PRACTICE_ROUND_MS,
  DEFAULT_AVATAR,
} from '../../constants';

/**
 * 配列をシャッフルするユーティリティ関数
 * Fisher-Yatesアルゴリズムを使用
 */
const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * ソロプレイ結果アイテムの型
 */
type SoloResultItem = {
  language: string;      // 正解の言語名
  choice: string | null; // ユーザーが選択した答え
  correct: boolean;      // 正解したかどうか
};

/**
 * フィードバック状態の型
 * 回答後に表示する正解/不正解情報
 */
type FeedbackState = {
  choice: string | null;    // ユーザーが選択した答え
  correctLanguage: string;  // 正解の言語名
  status: "correct" | "wrong" | "timeout";  // 結果ステータス
};

/**
 * OfflineAudioPracticeコンポーネント
 * 音声形式のオフライン練習モード
 * URLパスから難易度（major/rare）を判定
 * 5問連続で出題し、結果を集計して結果画面へ遷移
 * 音声は自動再生され、再生ボタンで何度でも聞き直せる
 */
const OfflineAudioPractice = () => {
  const navigate = useNavigate();
  const profile = useProfile();
  const isRare = window.location.pathname.includes("rare");
  const lockedRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [results, setResults] = useState<SoloResultItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const resultsRef = useRef<SoloResultItem[]>([]);

  const languagePool = isRare ? RARE_LANGUAGES : MAJOR_LANGUAGES;
  const difficultyLabel = isRare ? "Rare Difficulty" : "Major Difficulty";
  const apiMode = isRare ? "rare" : "major";

  const setLocked = (value: boolean) => {
    lockedRef.current = value;
    setIsLocked(value);
  };

  // 音声問題取得フック
  const { questions: audioQuestions, isLoading } = useAudioQuestions({
    count: 5,
    mode: apiMode as 'major' | 'rare',
  });

  // 選択肢の生成
  const choicesByIndex = useMemo(() => {
    return audioQuestions.map((q) => {
      const pool = languagePool.filter((lang) => lang !== q.language);
      const choices = shuffle(pool).slice(0, 3);
      return shuffle([q.language, ...choices]);
    });
  }, [audioQuestions, languagePool]);

  // 音声再生フック
  const { audioRef, play: playAudio } = useAudioPlayer({
    onEnded: () => {
      setNeedsManualPlay(false);
      setIsCounting(true);
    },
    onError: () => {
      setIsCounting(false);
      setNeedsManualPlay(true);
    },
    baseUrl: (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:8000',
  });

  const handleCountdownComplete = () => {
    if (isRare) {
      handleAdvance();
    } else {
      if (!lockedRef.current) {
        recordResult(null, "timeout");
      }
    }
  };

  const running = !!audioQuestions[index] && !feedback && isCounting;

  const { progress } = useRoundProgress({
    durationMs: PRACTICE_ROUND_MS,
    running,
    resetKey: `${index}-${isCounting ? 1 : 0}`,
    onComplete: handleCountdownComplete,
  });

  const progressForDisplay = isCounting && !feedback ? progress : 0;

  useEffect(() => {
    const current = audioQuestions[index];
    if (!current) return;
    setIsCounting(false);
    setNeedsManualPlay(false);
    setLocked(false);
    setFeedback(null);
    playAudio(current.audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioQuestions, index]);

  const handleAdvance = () => {
    setIndex((prev) => prev + 1);
  };

  const recordResult = (choice: string | null, forcedStatus?: "timeout") => {
    if (lockedRef.current) return;
    const current = audioQuestions[index];
    if (!current) return;
    setLocked(true);
    setIsCounting(false);
    const isCorrect = choice !== null && choice === current.language;
    const status: FeedbackState["status"] = forcedStatus
      ? "timeout"
      : isCorrect
        ? "correct"
        : "wrong";
    const nextResults = [
      ...resultsRef.current,
      { language: current.language, choice, correct: isCorrect },
    ];
    resultsRef.current = nextResults;
    setResults(nextResults);
    setFeedback({
      choice,
      correctLanguage: current.language,
      status,
    });
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      handleAdvance();
    }, FEEDBACK_DELAY_MS);
  };

  const handleAnswer = (choice: string) => {
    if (isRare) {
      handleAdvance();
      return;
    }
    if (isLocked || !!feedback) return;
    recordResult(choice);
  };

  useEffect(() => {
    if (!audioQuestions.length) return;
    if (index >= audioQuestions.length) {
      if (!isRare) {
        const payloadResults = resultsRef.current.length > 0 ? resultsRef.current : results;
        const payload = {
          mode: `audio-${apiMode}`,
          total: payloadResults.length,
          correct: payloadResults.filter((item) => item.correct).length,
          items: payloadResults,
        };
        localStorage.setItem("solo_results", JSON.stringify(payload));
      }
      navigate("/offline/results");
    }
  }, [audioQuestions.length, index, navigate, results, isRare, apiMode]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background-dark text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-800 bg-white/5 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">
            GuessThisLanguage
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-6 md:flex md:mr-6">
            <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Solo Mode
            </span>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-yellow-500">
              {difficultyLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex h-10 min-w-[100px] items-center justify-center rounded-full bg-red-500/10 px-4 text-sm font-bold text-red-500 transition-all hover:bg-red-500/20"
          >
            Quit Mode
          </button>
          <div className="size-10 overflow-hidden rounded-full border-2 border-primary">
            <img
              alt="User profile avatar"
              className="h-full w-full object-cover"
              src={profile.imageUrl || DEFAULT_AVATAR}
            />
          </div>
        </div>
      </header>

      <ProgressBar progress={progressForDisplay} height={8} />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="flex w-full max-w-[800px] flex-col items-center gap-12">
          <div className="w-full">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Listen to the snippet
              </p>
              <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    if (feedback) return;
                    const current = audioQuestions[index];
                    if (current) {
                      setIsCounting(false);
                      setNeedsManualPlay(false);
                      playAudio(current.audioUrl);
                    }
                  }}
                  disabled={!!feedback}
                  className="group relative z-20 mb-10 flex size-28 items-center justify-center rounded-full border-4 border-primary/20 bg-primary text-white shadow-[0_0_30px_rgba(19,127,236,0.5)] transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <span className="material-symbols-outlined text-5xl fill-1">
                    play_arrow
                  </span>
                  <div className="absolute inset-0 rounded-full border border-primary opacity-20 animate-ping" />
                </button>
                <div className="relative mb-6 flex h-24 w-full items-center justify-center overflow-hidden">
                  <svg
                    className="wave-glow absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 800 100"
                  >
                    <path
                      d="M0,50 Q100,20 200,50 T400,50 T600,50 T800,50"
                      fill="none"
                      stroke="rgba(19, 127, 236, 0.15)"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,50 Q150,80 300,50 T600,50 T900,50"
                      fill="none"
                      stroke="rgba(19, 127, 236, 0.3)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M0,50 Q50,5 100,50 T200,50 T300,50 T400,50 T500,50 T600,50 T700,50 T800,50"
                      fill="none"
                      stroke="#137fec"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <path
                      d="M0,50 Q100,90 200,50 T400,50 T600,50 T800,50"
                      fill="none"
                      stroke="rgba(19, 127, 236, 0.4)"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                </div>
                <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {feedback
                    ? feedback.status === "correct"
                      ? "✓ Correct!"
                      : feedback.status === "timeout"
                        ? `✗ Time's up! Answer: ${feedback.correctLanguage}`
                        : `✗ Wrong! Answer: ${feedback.correctLanguage}`
                    : isCounting
                      ? "Make your choice now"
                    : needsManualPlay
                      ? "Click play to start audio"
                    : "Wait for audio to finish"}
                </p>
                <audio ref={audioRef} preload="auto" />
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            {isLoading || audioQuestions.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center p-10 text-slate-500">
                <span className="material-symbols-outlined text-4xl animate-spin">
                  progress_activity
                </span>
                <span className="ml-4">読み込み中...</span>
              </div>
            ) : (choicesByIndex[index] ?? []).map((label, optionIndex) => (
              <button
                key={`${label}-${optionIndex}`}
                type="button"
                onClick={() => handleAnswer(label)}
                disabled={!isCounting || isLocked || isLoading || !!feedback}
                className={`group flex items-center justify-between rounded-xl border-2 bg-slate-900 p-5 text-left transition-all hover:border-primary hover:neon-glow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  feedback && label === feedback.correctLanguage
                    ? "border-emerald-500/60"
                    : "border-slate-800"
                } ${
                  feedback &&
                  feedback.choice &&
                  label === feedback.choice &&
                  feedback.status !== "correct"
                    ? "border-rose-500/70"
                    : ""
                }`}
              >
                <span className="text-lg font-bold transition-colors group-hover:text-primary">
                  {label}
                </span>
                <span className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-400">
                  {optionIndex + 1}
                </span>
              </button>
            ))
            }
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-background-dark/50 p-6 text-center text-xs font-medium text-slate-500 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px]">
              ESC
            </span>
            <span>Pause</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px]">
              SPACE
            </span>
            <span>Replay Audio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px]">
              1-4
            </span>
            <span>Select Answer</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OfflineAudioPractice;
