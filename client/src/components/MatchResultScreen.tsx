/**
 * 対戦結果画面コンポーネント
 * オンライン対戦終了後の結果を表示
 * 勝敗、スコア、レーティング変動、各ラウンドの詳細を含む
 */

import React from "react";

/**
 * レーティング変動の型
 */
type RpDelta = {
  value: string;          // 変動値（"+15" or "-8"等）
  trend: "up" | "down";   // 上昇か下降か
};

/**
 * 結果画面のプレイヤー情報型
 */
type ResultPlayer = {
  name: string;        // プレイヤー名
  score: string;       // スコア（"450"等）
  rpDelta: RpDelta;    // レーティング変動
  avatarUrl: string;   // アバター画像URL
  isWinner: boolean;   // 勝者かどうか
  isYou: boolean;      // 自分かどうか
};

/**
 * 統計情報の型
 */
type ResultStat = {
  label: string;             // ラベル（"Accuracy"等）
  value: string;             // 値（"80%"等）
  valueClassName?: string;   // 値のCSSクラス（色指定等）
};

/**
 * ラウンド詳細の型
 */
type RecapRound = {
  round: string;           // ラウンド番号（"1"等）
  lang: string;            // 出題された言語名
  mode: string;            // 問題タイプ（"text" or "audio"）
  ok: boolean;             // 正解したかどうか
  choice?: string | null;  // 選択した答え
  answer?: string;         // 正解
};

/**
 * MatchResultScreenコンポーネントのプロパティ型
 */
type MatchResultScreenProps = {
  variant: "victory" | "defeat";
  matchLabel: string;
  headline: string;
  subline: React.ReactNode;
  you: ResultPlayer;
  opponent: ResultPlayer;
  stats?: ResultStat[];
  recapRounds: RecapRound[];
  roundsLabel: string;
  onPlayAgain?: () => void;
  onHome?: () => void;
};

const MatchResultScreen: React.FC<MatchResultScreenProps> = ({
  variant,
  matchLabel,
  headline,
  subline,
  you,
  opponent,
  stats,
  recapRounds,
  roundsLabel,
  onPlayAgain,
  onHome,
}) => {
  const isVictory = variant === "victory";
  const accentText = isVictory ? "text-primary" : "text-red-500";
  const badgeBg = isVictory ? "bg-primary/10" : "bg-red-500/10";
  const glowClass = isVictory ? "victory-glow" : "defeat-glow";
  const logoBg = isVictory ? "bg-primary" : "bg-red-500";
  const recapOkClass = isVictory ? "text-green-500" : "text-green-500/80";
  const recapBadClass = isVictory ? "text-red-500/60" : "text-red-500";

  const renderPlayer = (player: ResultPlayer) => {
    const winnerRing = isVictory
      ? "border-primary ring-primary/5"
      : "border-red-500 ring-red-500/10";
    const winnerBadgeBg = isVictory ? "bg-primary" : "bg-red-500";
    const loserRing = isVictory ? "border-slate-800" : "border-slate-300";
    const loserText = isVictory ? "text-slate-600" : "text-slate-400";
    const winnerScore = "text-white";
    const rpClass =
      player.rpDelta.trend === "up"
        ? "bg-green-500/10 text-green-500"
        : "bg-red-500/10 text-red-500";
    const rpIcon = player.rpDelta.trend === "up" ? "add_circle" : "remove_circle";

    return (
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <div
            className={`size-28 rounded-full border-4 p-1.5 ${
              player.isWinner ? winnerRing : loserRing
            } ${player.isWinner ? "ring-8" : ""} ${
              !player.isWinner && !isVictory ? "grayscale opacity-80" : ""
            }`}
          >
            <div className="h-full w-full overflow-hidden rounded-full bg-slate-800">
              <img
                alt={`${player.name} avatar`}
                className="h-full w-full object-cover"
                src={player.avatarUrl}
              />
            </div>
          </div>
          {player.isWinner ? (
            <div
              className={`absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-4 border-[#0a0f14] ${winnerBadgeBg} text-white`}
            >
              <span className="material-symbols-outlined text-[16px]">
                verified
              </span>
            </div>
          ) : null}
        </div>
        <div className="text-center">
          <h3
            className={`text-lg font-bold ${
              player.isWinner ? "text-slate-400" : "text-slate-400"
            } ${player.isYou ? "" : "uppercase"}`}
          >
            {player.name}
          </h3>
          <p
            className={`mt-1 text-4xl font-black ${
              player.isWinner ? winnerScore : loserText
            }`}
          >
            {player.score}
          </p>
          <div
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-bold ${rpClass}`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {rpIcon}
            </span>
            {player.rpDelta.value}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f14] text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800/60 bg-[#0a0f14]/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${logoBg} text-white shadow-lg shadow-primary/20`}
          >
            <span className="material-symbols-outlined text-sm">translate</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">
            GuessThisLanguage
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={onHome}
              className={`text-sm font-medium text-slate-400 transition-colors hover:${accentText}`}
            >
              Home
            </button>
            <button
              type="button"
              className={`text-sm font-medium text-slate-400 transition-colors hover:${accentText}`}
            >
              Leaderboard
            </button>
            <button
              type="button"
              className={`text-sm font-medium text-slate-400 transition-colors hover:${accentText}`}
            >
              Practice
            </button>
          </div>
          <div className="hidden h-6 w-px bg-slate-800 md:block" />
          <button className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-white transition-all hover:bg-slate-700">
            <span className="material-symbols-outlined text-[20px]">
              account_circle
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center px-4 py-12 md:px-10">
        <div className="mb-12 w-full text-center">
          <span
            className={`mb-4 inline-flex items-center rounded-full ${badgeBg} px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${accentText}`}
          >
            {matchLabel}
          </span>
          <h1
            className={`${glowClass} text-[72px] font-black leading-none tracking-tighter ${accentText} md:text-[96px]`}
          >
            {headline}
          </h1>
          <p className="mt-4 text-base font-medium text-slate-400">{subline}</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <div className="relative flex flex-col items-center justify-around gap-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-10 md:flex-row">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
              {renderPlayer(you)}
              <div className="flex items-center md:flex-col">
                <div className="h-px w-12 rounded-full bg-slate-800 md:h-16 md:w-px" />
                <span className="px-4 py-2 text-sm font-black italic text-slate-600">
                  VS
                </span>
                <div className="h-px w-12 rounded-full bg-slate-800 md:h-16 md:w-px" />
              </div>
              {renderPlayer(opponent)}
            </div>

            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5"
                  >
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {stat.label}
                    </p>
                    <p
                      className={`text-2xl font-black ${
                        stat.valueClassName ?? "text-white"
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40">
              <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Match Recap
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {roundsLabel}
                </span>
              </div>
              <div className="scroll-hide flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  {recapRounds.map((item) => (
                    <div
                      key={item.round}
                      className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-4 text-xs font-black text-slate-500">
                          {item.round}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            {item.answer
                              ? `Correct: ${item.answer}${
                                  item.choice ? ` - You: ${item.choice}` : ""
                                }`
                              : item.choice
                                ? `You: ${item.choice}`
                                : "Correct: -"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`material-symbols-outlined ${
                          item.ok ? recapOkClass : recapBadClass
                        }`}
                      >
                        {item.ok ? "check_circle" : "cancel"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className={`group flex flex-1 items-center justify-center gap-3 rounded-2xl py-5 text-base font-black text-white shadow-xl transition-all hover:brightness-110 active:scale-[0.98] ${
              isVictory ? "bg-primary shadow-primary/30" : "bg-red-500 shadow-red-500/30"
            }`}
          >
            <span className="material-symbols-outlined transition-transform group-hover:rotate-12">
              replay
            </span>
            PLAY AGAIN
          </button>
          <button
            type="button"
            onClick={onHome}
            className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/50 py-5 text-base font-black text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">home</span>
            BACK TO HOME
          </button>
        </div>
      </main>

      <footer className="mt-auto py-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/50">
        <p>© 2024 GuessThisLanguage  EConquer the world of phonetics</p>
      </footer>
    </div>
  );
};

export default MatchResultScreen;
