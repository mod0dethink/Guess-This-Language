/**
 * オフラインテキスト練習ページコンポーネント
 * ソロプレイでテキスト形式の言語当て問題に挑戦
 * メジャー言語またはレア言語を選択可能
 * 5問出題され、各問題8秒の制限時間あり
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from '../../lib/profile';
import { useTextQuestions, useRoundProgress } from '../../hooks';
import ProgressBar from '../../components/ProgressBar';
import {
  MAJOR_TEXT_FALLBACK,
  RARE_TEXT_FALLBACK,
  MAJOR_LANGUAGES,
  RARE_LANGUAGES,
  PRACTICE_ROUND_MS,
  DEFAULT_AVATAR,
  FEEDBACK_DELAY_MS,
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
 * OfflineTextPracticeコンポーネント
 * テキスト形式のオフライン練習モード
 * URLパスから難易度（major/rare）を判定
 * 5問連続で出題し、結果を集計して結果画面へ遷移
 */
const OfflineTextPractice = () => {
  const navigate = useNavigate();
  const profile = useProfile();
  const isRare = window.location.pathname.includes("rare");
  const languagePool = isRare ? RARE_LANGUAGES : MAJOR_LANGUAGES;
  const lockedRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const readyTimeoutRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [results, setResults] = useState<SoloResultItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const resultsRef = useRef<SoloResultItem[]>([]);

  const fallbackQuestions = useMemo(
    () => (isRare ? RARE_TEXT_FALLBACK : MAJOR_TEXT_FALLBACK) as unknown as any[],
    [isRare]
  );

  const { questions: fetchedQuestions } = useTextQuestions({
    count: 5,
    mode: isRare ? 'rare' : undefined,
    fallback: fallbackQuestions as any,
  });

  const questions = useMemo(() => {
    return fallbackQuestions.map((q, i) => ({
      ...q,
      prompt: fetchedQuestions[i]?.prompt ?? q.prompt,
      answer: fetchedQuestions[i]?.answer ?? q.options[0],
    }));
  }, [fallbackQuestions, fetchedQuestions]);

  // 選択肢の生成
  const choicesByIndex = useMemo(() => {
    return questions.map((q) => {
      const pool = languagePool.filter((lang) => lang !== q.answer);
      const wrongChoices = shuffle(pool).slice(0, 3);
      return shuffle([q.answer, ...wrongChoices]);
    });
  }, [questions, languagePool]);

  const setLocked = (value: boolean) => {
    lockedRef.current = value;
    setIsLocked(value);
  };

  const handleAdvance = () => {
    setIsReady(false);
    setIndex((prev) => prev + 1);
  };

  const handleCountdownComplete = () => {
    if (!lockedRef.current) {
      recordResult(null, "timeout");
    }
  };

  const running = isReady && questions.length > 0 && index < questions.length && !feedback;

  const { progress } = useRoundProgress({
    durationMs: PRACTICE_ROUND_MS,
    running,
    resetKey: index,
    onComplete: handleCountdownComplete,
  });

  const recordResult = (choice: string | null, forcedStatus?: "timeout") => {
    if (lockedRef.current) return;
    const current = questions[index];
    if (!current) return;
    setLocked(true);
    const isCorrect = choice !== null && choice === current.answer;
    const status: FeedbackState["status"] = forcedStatus
      ? "timeout"
      : isCorrect
        ? "correct"
        : "wrong";
    const nextResults = [
      ...resultsRef.current,
      { language: current.answer, choice, correct: isCorrect },
    ];
    resultsRef.current = nextResults;
    setResults(nextResults);
    setFeedback({
      choice,
      correctLanguage: current.answer,
      status,
    });
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
      setLocked(false);
      handleAdvance();
    }, FEEDBACK_DELAY_MS);
  };

  const handleAnswer = (choice: string) => {
    if (isLocked || !!feedback) return;
    recordResult(choice);
  };

  useEffect(() => {
    if (!questions.length) return;
    if (index >= questions.length) {
      const payloadResults = resultsRef.current.length > 0 ? resultsRef.current : results;
      const payload = {
        mode: `text-${isRare ? 'rare' : 'major'}`,
        total: payloadResults.length,
        correct: payloadResults.filter((item) => item.correct).length,
        items: payloadResults,
      };
      localStorage.setItem("solo_results", JSON.stringify(payload));
      navigate("/offline/results");
    }
  }, [questions.length, index, navigate, results, isRare]);

  useEffect(() => {
    if (!questions.length || index >= questions.length) return;
    setIsReady(false);
    if (readyTimeoutRef.current !== null) {
      window.clearTimeout(readyTimeoutRef.current);
    }
    readyTimeoutRef.current = window.setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => {
      if (readyTimeoutRef.current !== null) {
        window.clearTimeout(readyTimeoutRef.current);
      }
    };
  }, [questions.length, index]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const current = questions[index];
  if (!current) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background-dark text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap bg-transparent px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="hidden text-lg font-bold leading-tight tracking-tight sm:block">
            GuessThisLanguage
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex h-10 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/50 px-6 text-sm font-bold text-slate-400 transition-all hover:bg-red-500/20 hover:text-red-500"
          >
            Quit
          </button>
          <div className="size-10 overflow-hidden rounded-full border-2 border-slate-700">
            <img
              alt="User profile avatar"
              className="h-full w-full object-cover"
              src={profile.imageUrl || DEFAULT_AVATAR}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center px-6 py-4">
        <div className="flex w-full max-w-[800px] flex-col items-center">
          <div className="mb-6 w-full space-y-3">
            <div className="flex items-end justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Round {String(index + 1).padStart(2, "0")} / 05
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {isRare ? "Rare Difficulty" : "Major Difficulty"}
              </span>
            </div>
            <ProgressBar progress={progress} height={8} />
          </div>

          <div className="mb-6 w-full">
            <div className="relative flex min-h-[260px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-8 text-center shadow-2xl backdrop-blur-sm md:p-12">
              <div className="absolute left-1/2 top-0 h-1 w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
              <p className="mb-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                Identify the Language
              </p>
              <h1 className="text-glow mb-6 text-3xl font-bold leading-relaxed tracking-tight text-white md:text-5xl selection:bg-primary selection:text-white">
                {current.prompt}
              </h1>
              <div className="flex items-center gap-2 rounded-full border border-slate-700/30 bg-slate-800/30 px-4 py-2">
                <span className="material-symbols-outlined text-sm text-primary/70">
                  public
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {current.region}
                </span>
              </div>
              {feedback && (
                <p className="mt-4 text-sm font-bold uppercase tracking-widest">
                  {feedback.status === "correct"
                    ? "✓ Correct!"
                    : feedback.status === "timeout"
                      ? `✗ Time's up! Answer: ${feedback.correctLanguage}`
                      : `✗ Wrong! Answer: ${feedback.correctLanguage}`}
                </p>
              )}
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {(choicesByIndex[index] || []).map((label: string, optionIndex: number) => (
              <button
                key={`${label}-${optionIndex}`}
                type="button"
                onClick={() => handleAnswer(label)}
                disabled={isLocked || !!feedback}
                className={`group relative flex items-center justify-between rounded-2xl border-2 bg-slate-900/60 p-5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
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
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-500">
                  {optionIndex + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-auto p-8">
        <div className="flex flex-wrap items-center justify-center gap-10 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          <div className="flex items-center gap-3">
            <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-slate-400">
              ESC
            </span>
            <span>Pause</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-slate-400">
              1-4
            </span>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-slate-400">
              H
            </span>
            <span>Hint</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OfflineTextPractice;
