/**
 * 対戦バトル画面コンポーネント
 * オンライン対戦中の問題出題と回答選択画面
 * プログレスバー、問題文、選択肢、プレイヤー情報を表示
 */

import React from "react";
import ProgressBar from "./ProgressBar";
import { clampProgress } from "../lib/progress";

/**
 * 選択肢の型
 */
type BattleOption = {
  id: number;     // 選択肢のID
  label: string;  // 選択肢の表示ラベル（言語名）
};

/**
 * プレイヤー情報の型
 */
type BattlePlayer = {
  role: string;                   // プレイヤーの役割（"YOU" or "OPPONENT"）
  correctCount: string;           // 正解数（"3/5"等）
  streak: string;                 // 連続正解数（"x3"等）
  accent: "primary" | "danger";   // 表示色（自分=primary、相手=danger）
  avatarUrl: string;              // アバター画像URL
  streakIcon: string;             // 連続正解アイコン名
};

/**
 * フィードバック状態の型
 * 回答後に正解/不正解を表示するための情報
 */
type FeedbackState = {
  choice: string | null;              // プレイヤーが選択した答え
  correctLabel: string;               // 正解の言語名
  status: "correct" | "wrong" | "timeout";  // 結果ステータス
};

/**
 * MatchBattleScreenコンポーネントのプロパティ型
 */
type MatchBattleScreenProps = {
  modeLabel: string;
  difficultyLabel: string;
  progressPercent: number;
  challengeTitle: string;
  mediaType: "text" | "audio";
  prompt?: string;
  origin?: string;
  audioCaption?: string;
  audioStatusLabel?: string;
  audioDisabled?: boolean;
  optionsDisabled?: boolean;
  options: BattleOption[];
  you: BattlePlayer;
  opponent: BattlePlayer;
  onQuit?: () => void;
  onSelectOption?: (option: BattleOption) => void;
  onReplayAudio?: () => void;
  feedback?: FeedbackState | null;
};

const accentStyles = {
  primary: {
    border: "border-primary",
    glow: "neon-border",
    xp: "text-primary",
    streakIcon: "text-primary",
    streakBg: "bg-primary/5 border-primary/10",
  },
  danger: {
    border: "border-red-500",
    glow: "",
    xp: "text-red-500",
    streakIcon: "text-red-500",
    streakBg: "bg-red-500/5 border-red-500/10",
  },
};

const MatchBattleScreen: React.FC<MatchBattleScreenProps> = ({
  modeLabel,
  difficultyLabel,
  progressPercent,
  challengeTitle,
  mediaType,
  prompt = "",
  origin = "",
  audioCaption = "Click to replay audio clue",
  audioStatusLabel,
  audioDisabled = false,
  optionsDisabled = false,
  options,
  you,
  opponent,
  onQuit,
  onSelectOption,
  onReplayAudio,
  feedback,
}) => {
  const clampedProgress = clampProgress(progressPercent);

  return (
    <div className="min-h-screen bg-background-dark text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-800 bg-white/5 px-6 py-3 backdrop-blur-md">
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
          <div className="hidden items-center gap-6 md:flex">
            <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              {modeLabel}
            </span>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-yellow-500">
              {difficultyLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onQuit}
            className="flex h-10 min-w-[100px] items-center justify-center rounded-full bg-red-500/10 px-4 text-sm font-bold text-red-500 transition-all hover:bg-red-500/20"
          >
            Quit Battle
          </button>
          <div className="size-10 overflow-hidden rounded-full border-2 border-primary">
            <img
              alt="User profile avatar"
              className="h-full w-full object-cover"
              src={you.avatarUrl}
            />
          </div>
        </div>
      </header>

      <ProgressBar progress={clampedProgress} height={8} />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-row items-stretch justify-between gap-8 px-6 py-8">
        <aside className="hidden w-64 flex-col justify-center gap-6 lg:flex">
          <div
            className={`flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-white/5 p-6 ${accentStyles[you.accent].glow}`}
          >
            <div
              className={`flex size-20 items-center justify-center rounded-full border-2 p-1 ${accentStyles[you.accent].border} bg-primary/20`}
            >
              <img
                alt="Player profile picture large"
                className="h-full w-full rounded-full object-cover"
                src={you.avatarUrl}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-400">{you.role}</p>
              <p className={`text-2xl font-bold ${accentStyles[you.accent].xp}`}>
                {you.correctCount}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Correct
              </p>
            </div>
          </div>
          <div
            className={`rounded-xl border p-4 text-center ${accentStyles[you.accent].streakBg}`}
          >
            <p className="mb-1 text-xs uppercase tracking-tighter text-slate-500">
              Current Streak
            </p>
            <div className="flex justify-center gap-1">
              <span
                className={`material-symbols-outlined text-xl ${accentStyles[you.accent].streakIcon}`}
              >
                {you.streakIcon}
              </span>
              <span className="text-xl font-bold">{you.streak}</span>
            </div>
          </div>
        </aside>

        <div className="flex w-full max-w-[850px] flex-1 flex-col items-center justify-center">
          <div className="mb-10 w-full">
            <div className="flex flex-col items-center gap-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                {challengeTitle}
              </p>
              <div className="relative flex min-h-[260px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-900 p-10 text-center shadow-2xl">
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-32 w-32 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
                {mediaType === "text" ? (
                  <>
                    <h1 className="text-glow mb-4 text-3xl font-bold leading-relaxed tracking-tight text-white md:text-5xl selection:bg-primary selection:text-white">
                      {prompt}
                    </h1>
                    <p className="text-sm font-medium italic text-slate-500">
                      {origin}
                    </p>
                    {feedback && (
                      <p className="mt-4 text-sm font-bold uppercase tracking-widest">
                        {feedback.status === "correct"
                          ? "✓ Correct!"
                          : feedback.status === "timeout"
                            ? `✗ Time's up! Answer: ${feedback.correctLabel}`
                            : `✗ Wrong! Answer: ${feedback.correctLabel}`}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onReplayAudio}
                      disabled={audioDisabled}
                      className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary shadow-[0_0_25px_rgba(19,127,236,0.5)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="material-symbols-outlined text-4xl text-white">
                        play_arrow
                      </span>
                    </button>
                    <div className="flex w-full max-w-md items-center justify-center">
                      <svg
                        className="h-16 w-full"
                        viewBox="0 0 560 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0 40 C40 10, 80 10, 120 40 C160 70, 200 70, 240 40 C280 10, 320 10, 360 40 C400 70, 440 70, 480 40 C520 10, 560 10, 600 40"
                          stroke="#1E86FF"
                          strokeWidth="3"
                          strokeLinecap="round"
                          opacity="0.65"
                        />
                        <path
                          d="M0 40 C40 70, 80 70, 120 40 C160 10, 200 10, 240 40 C280 70, 320 70, 360 40 C400 10, 440 10, 480 40 C520 70, 560 70, 600 40"
                          stroke="#1E86FF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.35"
                        />
                      </svg>
                    </div>
                    <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                      {audioStatusLabel || audioCaption}
                    </p>
                    {feedback && (
                      <p className="mt-4 text-sm font-bold uppercase tracking-widest">
                        {feedback.status === "correct"
                          ? "✓ Correct!"
                          : feedback.status === "timeout"
                            ? `✗ Time's up! Answer: ${feedback.correctLabel}`
                            : `✗ Wrong! Answer: ${feedback.correctLabel}`}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectOption?.(option)}
                disabled={optionsDisabled}
                className={`group relative flex items-center justify-between rounded-2xl border-2 bg-slate-900/60 p-5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                  feedback && option.label === feedback.correctLabel
                    ? "border-emerald-500/60"
                    : "border-slate-800"
                } ${
                  feedback &&
                  feedback.choice &&
                  option.label === feedback.choice &&
                  feedback.status !== "correct"
                    ? "border-rose-500/70"
                    : ""
                }`}
              >
                <span className="text-lg font-bold transition-colors group-hover:text-primary">
                  {option.label}
                </span>
                <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-400">
                  {option.id}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex w-full items-center justify-between rounded-xl border border-slate-800 bg-white/5 px-4 py-3 lg:hidden">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-full border-2 p-0.5 ${accentStyles[you.accent].border}`}>
                <img
                  alt="Player score thumb"
                  className="h-full w-full rounded-full object-cover"
                  src={you.avatarUrl}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  You
                </p>
                <p className="text-sm font-bold">{you.correctCount}</p>
              </div>
            </div>
            <div className="text-xl font-black italic text-primary">VS</div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Opponent
                </p>
                <p className="text-sm font-bold">{opponent.correctCount}</p>
              </div>
              <div
                className={`size-10 rounded-full border-2 p-0.5 ${accentStyles[opponent.accent].border}`}
              >
                <img
                  alt="Opponent score thumb"
                  className="h-full w-full rounded-full object-cover"
                  src={opponent.avatarUrl}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden w-64 flex-col justify-center gap-6 lg:flex">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-white/5 p-6">
            <div
              className={`flex size-20 items-center justify-center rounded-full border-2 p-1 ${accentStyles[opponent.accent].border} bg-red-500/20`}
            >
              <img
                alt="Opponent profile picture large"
                className="h-full w-full rounded-full object-cover"
                src={opponent.avatarUrl}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-400">
                {opponent.role}
              </p>
              <p
                className={`text-2xl font-bold ${accentStyles[opponent.accent].xp}`}
              >
                {opponent.correctCount}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Correct
              </p>
            </div>
          </div>
          <div
            className={`rounded-xl border p-4 text-center ${accentStyles[opponent.accent].streakBg}`}
          >
            <p className="mb-1 text-xs uppercase tracking-tighter text-slate-500">
              Current Streak
            </p>
            <div className="flex justify-center gap-1">
              <span
                className={`material-symbols-outlined text-xl ${accentStyles[opponent.accent].streakIcon}`}
              >
                {opponent.streakIcon}
              </span>
              <span className="text-xl font-bold">{opponent.streak}</span>
            </div>
          </div>
        </aside>
      </main>

      <footer className="p-6 text-center text-xs font-medium text-slate-500">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300">
              ESC
            </span>
            <span>Pause Game</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300">
              1-4
            </span>
            <span>Select Language</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300">
              R
            </span>
            <span>Report Error</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MatchBattleScreen;
