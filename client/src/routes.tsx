/**
 * アプリケーション全体のルーティング設定
 * 各ページへのパスとコンポーネントのマッピングを定義
 */

import { Route, Routes } from "react-router-dom";
// 認証関連ページ
import { LoginPage, SignupPage } from "./pages/auth";
// ホームページ
import HomePage from "./pages/Home";
// 練習モード（ソロプレイ）
import { OfflineTextPractice, OfflineAudioPractice } from "./pages/practice";
// 結果画面
import { SoloResultsPage } from "./pages/results";
// 対戦モード（オンラインマッチ）
import {
  OnlineTextMatch,
  OnlineMatchVictory,
  OnlineMatchDefeat,
} from "./pages/match";
// リーダーボードとプロフィール
import { LeaderboardPage } from "./pages/leaderboard";
import { ProfilePage } from "./pages/profile";
// レイアウト
import SidebarLayout from "./layouts/SidebarLayout";

/**
 * Routerコンポーネント
 * アプリケーション全体のルーティングを管理
 *
 * ルート構成:
 * - /login, /signup: 認証不要ページ
 * - /home, /leaderboard, /profile: サイドバー付きレイアウト
 * - /online/*: オンライン対戦関連（待機・バトル・結果）
 * - /offline/*: オフライン練習関連（テキスト・音声、メジャー・レア言語）
 */
export const Router = () => {
    return (
        <Routes>
            {/* 認証ページ（レイアウトなし） */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* サイドバー付きレイアウトを使用するページ */}
            <Route element={<SidebarLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* オンライン対戦モード */}
            <Route path="/online/text" element={<OnlineTextMatch />} />
            <Route path="/online/waiting" element={<OnlineTextMatch />} />
            <Route path="/online/victory" element={<OnlineMatchVictory />} />
            <Route path="/online/defeat" element={<OnlineMatchDefeat />} />

            {/* オフライン練習モード（テキスト問題） */}
            <Route path="/offline/text-major" element={<OfflineTextPractice />} />
            <Route path="/offline/text-rare" element={<OfflineTextPractice />} />

            {/* オフライン練習モード（音声問題） */}
            <Route path="/offline/audio-major" element={<OfflineAudioPractice />} />
            <Route path="/offline/audio-rare" element={<OfflineAudioPractice />} />

            {/* オフライン練習の結果画面 */}
            <Route path="/offline/results" element={<SoloResultsPage />} />
        </Routes>
    )
}

export default Router;
