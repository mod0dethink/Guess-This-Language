/**
 * リーダーボードページコンポーネント
 * レーティング上位30名のランキングを表示
 * ユーザー名による検索フィルター機能あり
 */

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_AVATAR } from '../../constants';
import { getLeaderboard } from '../../api';
import type { LeaderboardEntry } from '../../types';
import { useProfile } from "../../lib/profile";
import MainHeader from "../../components/MainHeader";

/**
 * LeaderboardPageコンポーネント
 * マウント時にAPIから上位30名のランキングを取得
 * 検索フィールドでユーザー名によるフィルタリングが可能
 * 1位〜3位は特別な色で表示（金・銀・銅）
 */
const LeaderboardPage = () => {
  const profile = useProfile();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // 新しいAPI層を使用
    getLeaderboard(30)
      .then((data) => {
        setLeaders(data.leaders);
      })
      .catch((error) => {
        console.error("Failed to load leaderboard:", error);
      });
  }, []);

  const filteredLeaders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leaders;
    return leaders.filter((leader) =>
      leader.username.toLowerCase().includes(needle)
    );
  }, [leaders, query]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-slate-300";
    if (rank === 3) return "text-amber-700";
    return "text-[#92adc9]";
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-background-dark font-display text-white antialiased"
      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
    >
      <MainHeader avatarUrl={profile.imageUrl || DEFAULT_AVATAR} />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between p-8 pb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Leaderboard
            </h2>
            <p className="text-sm text-[#92adc9]">
              Season 12: The Polyglot Challenge
            </p>
          </div>
          <div className="w-80">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92adc9]">
                search
              </span>
              <input
                className="w-full rounded-lg border-none bg-[#233648] py-2.5 pl-10 pr-4 text-sm text-white transition-all focus:ring-2 focus:ring-primary/50"
                placeholder="Search players..."
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="mb-2 px-8">
          <div className="grid grid-cols-12 border-b border-[#324d67]/50 px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#92adc9]">
            <div className="col-span-1">Rank</div>
            <div className="col-span-9">Player</div>
            <div className="col-span-2 text-right">RP</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-32">
          <div className="flex flex-col gap-2">
            {filteredLeaders.map((row) => (
              <div
                key={row.rank}
                className="glass-card grid grid-cols-12 items-center rounded-xl px-6 py-4 transition-colors hover:bg-[#233648]"
              >
                <div className={`col-span-1 text-lg font-bold ${getRankColor(row.rank)}`}>
                  #{row.rank}
                </div>
                <div className="col-span-9 flex items-center gap-4">
                  <img
                    className="h-10 w-10 rounded-lg object-cover"
                    src={row.imageUrl || DEFAULT_AVATAR}
                  />
                  <span className="font-bold">{row.username}</span>
                </div>
                <div className="col-span-2 text-right font-bold text-primary">
                  {row.rating.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </main>
    </div>
  );
};

export default LeaderboardPage;
