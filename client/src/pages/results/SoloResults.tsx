/**
 * ソロプレイ結果ページコンポーネント
 * オフライン練習モードの結果を表示
 * LocalStorageから結果データを読み込んで集計・表示
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/**
 * SoloResultsPageコンポーネント
 * オフライン練習モードの結果画面
 * 正解数、正答率、各問題の正誤を表示
 * LocalStorageの"solo_results"キーから結果データを取得
 */
const SoloResultsPage = () => {
  const navigate = useNavigate();
  const results = useMemo(() => {
    const raw = localStorage.getItem("solo_results");
    if (!raw) {
      return {
        total: 0,
        correct: 0,
        items: [] as { language: string; correct: boolean }[],
      };
    }
    try {
      const parsed = JSON.parse(raw) as {
        total?: number;
        correct?: number;
        items?: { language: string; correct: boolean }[];
      };
      const items = parsed.items ?? [];
      const correct = parsed.correct ?? items.filter((item) => item.correct).length;
      const total = parsed.total ?? items.length;
      return {
        total,
        correct,
        items,
      };
    } catch {
      return {
        total: 0,
        correct: 0,
        items: [] as { language: string; correct: boolean }[],
      };
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background-dark text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-8 py-2">
        <div className="flex items-center gap-4">
          <div className="size-7 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-base font-bold leading-tight tracking-tight">
            GuessThisLanguage
          </h2>
        </div>
        {/* <div className="flex gap-3">
          <button className="flex size-9 items-center justify-center rounded-full bg-slate-800 hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-lg">settings</span>
          </button>
          <button className="flex size-9 items-center justify-center rounded-full bg-slate-800 hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-lg">person</span>
          </button>
        </div> */}
      </header>

      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center px-4 py-8">
        <div className="mb-2 flex flex-wrap justify-center gap-3 p-2">
          {/* <div className="flex h-7 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-3 text-primary shadow-[0_0_16px_rgba(19,127,236,0.35)]">
            <span className="material-symbols-outlined text-base">star</span>
            <p className="text-xs font-bold tracking-wide">NEW BEST!</p>
          </div> */}
        </div>
        <h1 className="pb-5 pt-2 text-center text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          Solo Mode Results
        </h1>

        <div className="mb-8 w-full max-w-[360px]">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-primary/20 bg-[#1a2632] p-8 text-center shadow-2xl shadow-primary/10">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Final Streak
            </p>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">
                local_fire_department
              </span>
            <p className="text-6xl font-black leading-tight text-white">
              {results.correct}
            </p>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Languages Guessed Correctly
            </p>
          </div>
        </div>

        <div className="mb-8 w-full max-w-[560px] overflow-hidden rounded-xl border border-slate-800 bg-[#1a2632]">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h3 className="text-base font-bold tracking-tight">Session Recap</h3>
            <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-400">
              {results.total > 0 ? `${results.total} ROUNDS` : "NO DATA"}
            </span>
          </div>
          <div className="custom-scrollbar max-h-[260px] overflow-y-auto">
            {results.items.length === 0 ? (
              <div className="px-6 py-6 text-center text-xs text-slate-500">
                No recent solo results found.
              </div>
            ) : (
              results.items.map((row, idx) => (
                <div
                  key={`${row.language}-${idx}`}
                  className="flex items-center justify-between border-b border-slate-800/60 px-6 py-3 last:border-b-0 hover:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-slate-400">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold">{row.language}</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-lg ${
                      row.correct ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {row.correct ? "check_circle" : "cancel"}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-slate-800 bg-[#1a2632] px-6 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Scroll for more results
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-[560px] flex-col gap-4">
          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-white text-sm font-bold tracking-wide shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]">
              <span className="material-symbols-outlined text-base">replay</span>
              Play Again
            </button>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-800 text-sm font-bold tracking-wide text-white transition-all hover:bg-slate-700 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">home</span>
              Back to Home
            </button>
          </div>
          {/* <button className="flex h-11 items-center justify-center gap-2 rounded-full border border-slate-800 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-all hover:bg-white/5 active:scale-[0.99]">
            <span className="material-symbols-outlined text-base">share</span>
            Share Result
          </button> */}
        </div>
      </main>

    </div>
  );
};

export default SoloResultsPage;
