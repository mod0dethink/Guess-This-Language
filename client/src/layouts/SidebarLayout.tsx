/**
 * サイドバーレイアウトコンポーネント
 * ホーム、リーダーボード、プロフィールページで使用される共通レイアウト
 * 左側にサイドバー、右側にページコンテンツを配置
 */

import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

/**
 * SidebarLayoutコンポーネント
 * サイドバー付きのレイアウトを提供
 * 現在のURLパスから自動的にアクティブページを判定してサイドバーに反映
 */
const SidebarLayout = () => {
  // 現在のパスを取得
  const location = useLocation();
  const path = location.pathname;

  // パスからアクティブページを判定
  const isLeaderboard = path.startsWith("/leaderboard");
  const isProfile = path.startsWith("/profile");
  const active = isLeaderboard
    ? "leaderboard"
    : isProfile
      ? "profile"
      : "home";

  return (
    <div className="min-h-screen bg-background-dark text-slate-50">
      <div className="flex min-h-screen">
        {/* 左側: サイドバー（ナビゲーション、ユーザー情報） */}
        <Sidebar active={active} />
        {/* 右側: ページコンテンツ（Outletで子ルートをレンダリング） */}
        <div className="flex-1">{<Outlet />}</div>
      </div>
    </div>
  );
};

export default SidebarLayout;
