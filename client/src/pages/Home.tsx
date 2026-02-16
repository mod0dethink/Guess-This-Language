/**
 * ホームページコンポーネント
 * ゲームモード選択画面（ソロ練習 or オンライン対戦）
 * 問題タイプと難易度を選択してゲーム開始
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../lib/profile";
import { DEFAULT_AVATAR } from "../constants";
import { ensureAudioAutoplayUnlocked } from "../lib/audioAutoplay";
import MainHeader from "../components/MainHeader";

/**
 * ゲームモードの型
 */
type Mode = "solo" | "multi";

/**
 * マッチ選択の型
 * テキスト/音声 × メジャー/レアの4パターン
 */
type MatchSelection = "text-major" | "text-rare" | "audio-major" | "audio-rare";

/**
 * HomePageコンポーネント
 * ゲームモードと問題設定を選択してゲーム開始
 * ソロモード: オフライン練習（/offline/...）
 * マルチモード: オンライン対戦（/online/text?mode=...）
 */
const HomePage = () => {
  const navigate = useNavigate();
  const profile = useProfile();
  const [mode, setMode] = useState<Mode>("multi");
  const [selection, setSelection] = useState<MatchSelection | null>(null);

  const handlePrimaryAction = async () => {
    if (!selection) return;
    if (mode === "multi") {
      navigate(`/online/text?mode=${selection}`);
      return;
    }
    if (selection === "text-major") {
      navigate("/offline/text-major");
      return;
    }
    if (selection === "text-rare") {
      navigate("/offline/text-rare");
      return;
    }
    if (selection === "audio-major") {
      await ensureAudioAutoplayUnlocked();
      navigate("/offline/audio-major");
      return;
    }
    if (selection === "audio-rare") {
      await ensureAudioAutoplayUnlocked();
      navigate("/offline/audio-rare");
    }
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setSelection(null);
  };

  // const modeLabel = mode === "solo" ? "Solo" : "Multi";

  return (
    <div className="flex min-h-screen flex-col bg-background-dark text-slate-100">
      <MainHeader avatarUrl={profile.imageUrl || DEFAULT_AVATAR} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center overflow-y-auto px-6 py-10 lg:px-20">
            <div className="mb-10 w-full text-center">
              <h1 className="pb-2 text-[40px] font-bold leading-tight tracking-tight text-slate-50">
                Select Your Challenge
              </h1>
              <p className="mb-8 text-lg font-normal text-slate-400">
                Customize your experience and jump into a match or practice
                session.
              </p>
              <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleModeChange("multi")}
                  className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all ${
                    mode === "multi"
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-500 hover:text-primary dark:text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">hub</span>
                  Multiplayer
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("solo")}
                  className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all ${
                    mode === "solo"
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-500 hover:text-primary dark:text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    person_play
                  </span>
                  Solo Mode
                </button>
              </div>
            </div>

            <div className="mb-14 grid w-full grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-4">
                  <span className="material-symbols-outlined text-primary">
                    description
                  </span>
                  <h2 className="text-xl font-bold">Text Mode</h2>
                  {/* <span className="ml-auto rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    {modeLabel}
                  </span> */}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelection("text-major")}
                    aria-pressed={selection === "text-major"}
                    className={`group relative overflow-hidden rounded-xl border-2 bg-slate-800 p-6 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-xl ${
                      selection === "text-major"
                        ? "border-primary shadow-xl"
                        : "border-transparent"
                    }`}
                  >
                    <div className="absolute -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <span className="material-symbols-outlined">
                            public
                          </span>
                        </div>
                        {selection === "text-major" ? (
                          <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">
                            <span className="material-symbols-outlined text-[12px] fill-1">
                              check_circle
                            </span>
                            Selected
                          </div>
                        ) : null}
                      </div>
                      <h3 className="mb-2 text-xl font-bold">
                        Major Languages
                      </h3>
                      <p className="text-sm text-slate-400">
                        Identify Spanish, English, Mandarin, and more common
                        scripts.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelection("text-rare")}
                    aria-pressed={selection === "text-rare"}
                    className={`group relative overflow-hidden rounded-xl border-2 bg-slate-800 p-6 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-xl ${
                      selection === "text-rare"
                        ? "border-primary shadow-xl"
                        : "border-transparent"
                    }`}
                  >
                    <div className="absolute -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <span className="material-symbols-outlined">
                            travel_explore
                          </span>
                        </div>
                        {selection === "text-rare" ? (
                          <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">
                            <span className="material-symbols-outlined text-[12px] fill-1">
                              check_circle
                            </span>
                            Selected
                          </div>
                        ) : null}
                      </div>
                      <h3 className="mb-2 text-xl font-bold">Rare Scripts</h3>
                      <p className="text-sm text-slate-400">
                        Challenge yourself with Tamil, Hebrew, Amharic, and
                        indigenous scripts.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-4">
                  <span className="material-symbols-outlined text-[#f5576c]">
                    volume_up
                  </span>
                  <h2 className="text-xl font-bold">Audio Mode</h2>
                  {/* <span className="ml-auto rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    {modeLabel}
                  </span> */}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelection("audio-major")}
                    aria-pressed={selection === "audio-major"}
                    className={`group relative overflow-hidden rounded-xl border-2 bg-slate-800 p-6 shadow-sm transition-all ${
                      selection === "audio-major"
                        ? "border-primary shadow-xl ring-2 ring-primary ring-offset-4 ring-offset-white dark:ring-offset-background-dark"
                        : "border-transparent hover:border-primary/50 hover:shadow-xl"
                    }`}
                  >
                    <div className="absolute -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/10" />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-primary p-2 text-white">
                          <span className="material-symbols-outlined">
                            headphones
                          </span>
                        </div>
                        {selection === "audio-major" ? (
                          <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">
                            <span className="material-symbols-outlined text-[12px] fill-1">
                              check_circle
                            </span>
                            Selected
                          </div>
                        ) : null}
                      </div>
                      <h3 className="mb-2 text-xl font-bold">Major Dialects</h3>
                      <p className="text-sm text-slate-400">
                        Listen to the rhythms of French, Arabic, Hindi, and
                        global tongues.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelection("audio-rare")}
                    aria-pressed={selection === "audio-rare"}
                    className={`group relative overflow-hidden rounded-xl border-2 bg-slate-800 p-6 shadow-sm transition-all ${
                      selection === "audio-rare"
                        ? "border-primary shadow-xl ring-2 ring-primary ring-offset-4 ring-offset-white dark:ring-offset-background-dark"
                        : "border-transparent hover:border-[#f5576c]/50 hover:shadow-xl"
                    }`}
                  >
                    <div className="absolute -mr-16 -mt-16 h-32 w-32 rounded-full bg-[#f5576c]/5 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-[#f5576c]/10 p-2 text-[#f5576c]">
                          <span className="material-symbols-outlined">
                            record_voice_over
                          </span>
                        </div>
                        {selection === "audio-rare" ? (
                          <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">
                            <span className="material-symbols-outlined text-[12px] fill-1">
                              check_circle
                            </span>
                            Selected
                          </div>
                        ) : null}
                      </div>
                      <h3 className="mb-2 text-xl font-bold">Ancient & Rare</h3>
                      <p className="text-sm text-slate-400">
                        Can you distinguish between Basque, Quechua, and
                        endangered languages?
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full max-w-md">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!selection}
                className="flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-primary text-xl font-bold text-white shadow-2xl shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {mode === "multi" ? "Start Multiplayer" : "Start Solo Game"}
                </span>
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            </div>
      </main>

    </div>
  );
};

export default HomePage;
