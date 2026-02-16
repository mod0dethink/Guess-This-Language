/**
 * 対戦待機画面コンポーネント
 * オンライン対戦のマッチング待機中に表示される画面
 * 経過時間と言語に関する豆知識を表示
 */

import React from "react";

/**
 * MatchWaitingScreenコンポーネントのプロパティ型
 */
type MatchWaitingScreenProps = {
  title: string;         // タイトル（"Finding your perfect match..."等）
  subtitle?: string;     // サブタイトル（"Searching global servers..."等）
  minutes: string;       // 経過時間の分（"00"等）
  seconds: string;       // 経過時間の秒（"15"等）
  factTitle?: string;    // 豆知識のタイトル（"Did you know?"等）
  factLead?: string;     // 豆知識のリード（言語名等）
  factBody?: string;     // 豆知識の本文
  onCancel?: () => void; // キャンセルボタンのコールバック
};

/**
 * MatchWaitingScreenコンポーネント
 * マッチング待機中の画面を表示
 * アニメーション付きのアイコン、経過時間、言語豆知識、キャンセルボタンを含む
 * @param props - タイトル、経過時間、豆知識、キャンセルコールバック
 */
const MatchWaitingScreen: React.FC<MatchWaitingScreenProps> = ({
  title,
  subtitle = "Searching global servers for active players",
  minutes,
  seconds,
  factTitle = "Did you know?",
  factLead = "Silbo Gomero",
  factBody = "is a whistled language used in the Canary Islands to communicate across deep ravines.",
  onCancel,
}) => {
  return (
    <div className="min-h-screen w-full bg-background-dark font-display text-slate-100">
      <div className="relative flex w-full flex-col overflow-x-hidden">
        <main className="mx-auto flex w-full max-w-[960px] flex-col items-center px-4 pt-16 pb-8" style={{ transform: 'scale(0.8)' }}>
          <div className="relative mb-16 flex items-center justify-center">
            <div className="relative z-10 flex size-32 items-center justify-center rounded-full bg-primary shadow-[0_0_40px_rgba(19,127,236,0.6)] animate-pulse-dot">
              <span className="material-symbols-outlined text-5xl text-white">
                graphic_eq
              </span>
            </div>
          </div>

          <div className="mb-4 text-center">
            <h2 className="px-4 text-[32px] font-bold leading-tight tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>

          <div className="mx-auto flex max-w-xs gap-4 px-4 py-4">
            <div className="flex grow basis-0 flex-col items-stretch gap-2">
              <div className="flex h-12 items-center justify-center rounded-xl bg-slate-800/50 px-4 backdrop-blur-sm">
                <p className="text-lg font-bold leading-tight tracking-tight text-white">
                  {minutes}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <p className="text-xs font-normal uppercase tracking-wider text-slate-400">
                  Minutes
                </p>
              </div>
            </div>
            <div className="flex grow basis-0 flex-col items-stretch gap-2">
              <div className="flex h-12 items-center justify-center rounded-xl border border-primary/20 bg-slate-800/50 px-4 backdrop-blur-sm">
                <p className="text-lg font-bold leading-tight tracking-tight text-primary">
                  {seconds}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <p className="text-xs font-normal uppercase tracking-wider text-slate-400">
                  Seconds
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-800/20 p-8 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-center gap-2 text-primary">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              <h4 className="text-sm font-bold uppercase tracking-widest">
                {factTitle}
              </h4>
            </div>
            <div className="text-center">
              <p className="px-4 text-lg leading-relaxed text-slate-300">
                <span className="font-bold text-primary">{factLead}</span>{" "}
                {factBody}
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <div className="size-1.5 rounded-full bg-primary" />
              <div className="size-1.5 rounded-full bg-slate-700" />
              <div className="size-1.5 rounded-full bg-slate-700" />
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-10 text-sm font-bold tracking-wide text-slate-200 transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
            >
              CANCEL SEARCH
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MatchWaitingScreen;
