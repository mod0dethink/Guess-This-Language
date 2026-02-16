/**
 * アプリケーションヘッダーコンポーネント
 * アプリケーション名とプロフィールボタンを表示（現在は未使用）
 */

import React from "react";

/**
 * AppHeaderコンポーネント
 * アプリケーションのタイトルと説明を表示するヘッダー
 * 注: 現在のレイアウトでは使用されていない（旧バージョンの残骸）
 */
const AppHeader: React.FC = () => {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-slate-700/60 bg-gradient-to-r from-slate-800/90 to-slate-700/80 px-6 py-4 shadow-xl shadow-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 text-slate-100">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
          Lingo Duel
        </p>
        <h1 className="text-2xl font-semibold">Guess This Language</h1>
        <p className="text-sm text-slate-200">
          You Guess A Language From An Audio and Text
        </p>
      </div>
      <button className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20">
        プロフィール
      </button>
    </header>
  );
};

export default AppHeader;
