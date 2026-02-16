/**
 * サイドバーコンポーネント
 * ホーム、プロフィール、リーダーボードページで表示される左側のナビゲーションバー
 * ユーザー情報（アバター、ユーザー名、レーティング、順位）を表示
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "../lib/auth";
import { setStoredProfile, useProfile } from "../lib/profile";
import { DEFAULT_AVATAR } from "../constants";

/**
 * サイドバーのアクティブページ型
 * 現在表示中のページを示す
 */
type SidebarActive = "home" | "profile" | "settings" | "leaderboard";

/**
 * サイドバーコンポーネントのプロパティ型
 */
type SidebarProps = {
  active: SidebarActive;  // 現在アクティブなページ（ハイライト表示に使用）
};

/**
 * Sidebarコンポーネント
 * ユーザー情報の表示とページナビゲーションを提供
 * マウント時にAPIからプロフィール情報と順位情報を取得
 * @param active - 現在アクティブなページ
 */
const Sidebar = ({ active }: SidebarProps) => {
  const navigate = useNavigate();
  const profile = useProfile();
  const [displayName, setDisplayName] = useState("Alex G.");
  const [rank, setRank] = useState<number | null>(null);
  const avatarUrl = profile.imageUrl || DEFAULT_AVATAR;
  const ratingValue = profile.rating ?? 1200;

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) return;
    if (auth.username) {
      setDisplayName(auth.username);
    }
    const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
    const url = `${baseUrl && baseUrl.length > 0 ? baseUrl : "http://localhost:8000"}/users/me`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data:
            | { imageUrl?: string; bio?: string; username?: string; rating?: number }
            | null
        ) => {
          if (data?.imageUrl || data?.bio || data?.username || data?.rating !== undefined) {
          setStoredProfile({
            imageUrl: data?.imageUrl,
            bio: data?.bio,
            username: data?.username,
            rating: data?.rating,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (profile.username) {
      setDisplayName(profile.username);
    }
  }, [profile.username]);

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) return;
    const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
    const url = `${baseUrl && baseUrl.length > 0 ? baseUrl : "http://localhost:8000"}/users/me/rank`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rank?: number; rating?: number } | null) => {
        if (!data) return;
        if (data.rating !== undefined) {
          setStoredProfile({ rating: data.rating });
        }
        if (data.rank !== undefined) {
          setRank(data.rank);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <aside className="hidden w-64 flex-col justify-between border-r border-slate-800 bg-background-dark p-6 lg:flex">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="size-12 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url("${avatarUrl}")`,
                }}
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-normal">
                {displayName}
              </h1>
                {/* <p className="text-xs font-normal text-slate-300">
                  ここにランクのタイトルいれる、余裕があったら
                </p> */}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Rank Points (RP)
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  military_tech
                </span>
                <span className="text-lg font-bold text-white">
                  {ratingValue.toLocaleString()} RP
                  <span className="ml-2 text-xs font-semibold text-slate-300">
                    {rank ? `#${rank}` : "UNRANKED"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className={`flex items-center gap-3 rounded-full px-4 py-3 transition-all ${
              active === "home"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="material-symbols-outlined">home</span>
            <p className="text-sm font-medium">Home</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className={`flex items-center gap-3 rounded-full px-4 py-3 transition-all ${
              active === "profile"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="material-symbols-outlined">person</span>
            <p className="text-sm font-medium">Profile</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/leaderboard")}
            className={`flex items-center gap-3 rounded-full px-4 py-3 transition-all ${
              active === "leaderboard"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="material-symbols-outlined">leaderboard</span>
            <p className="text-sm font-medium">Leaderboard</p>
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
