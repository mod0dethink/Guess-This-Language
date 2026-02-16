/**
 * 認証ページ用レイアウトコンポーネント
 * ログインページとサインアップページで使用される共通レイアウト
 * タイトル、サブタイトル、フォーム、フッターリンクを表示
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * AuthLayoutコンポーネントのプロパティ型
 */
type AuthLayoutProps = {
  title: string;            // ページタイトル（"ログイン" or "サインアップ"）
  subtitle: string;         // サブタイトル（説明文）
  footerLabel: string;      // フッターのラベル（"アカウントをお持ちでない方は"等）
  footerLinkLabel: string;  // フッターリンクのラベル（"サインアップ"等）
  footerLinkTo: string;     // フッターリンクの遷移先（"/signup"等）
  children: ReactNode;      // フォーム部分（LoginPageまたはSignupPageから渡される）
};

/**
 * AuthLayoutコンポーネント
 * 認証ページの統一されたレイアウトを提供
 * 中央に配置されたカード形式で表示
 * @param props - タイトル、サブタイトル、フッター情報、子要素
 */
const AuthLayout = ({
  title,
  subtitle,
  footerLabel,
  footerLinkLabel,
  footerLinkTo,
  children,
}: AuthLayoutProps) => (
  <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md">
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-slate-400 text-sm">{subtitle}</p>
      </div>
      <div className="rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl shadow-black/40 p-8 sm:p-10">
        {children}
        <p className="text-sm text-center text-slate-400 mt-6">
          {footerLabel}{" "}
          <Link
            to={footerLinkTo}
            className="font-medium text-white hover:text-slate-200 underline-offset-4 underline transition-colors"
          >
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  </div>
);

export default AuthLayout;
