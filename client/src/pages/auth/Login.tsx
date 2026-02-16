/**
 * ログインページコンポーネント
 * ユーザー名とパスワードを入力してログイン
 * ログイン状態を保持するオプション（remember me）あり
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { saveAuth } from "../../lib/auth";
import { login } from "../../api";

/**
 * LoginPageコンポーネント
 * ログインフォームの表示と認証処理
 * 成功時はJWTトークンを保存してホームページへ遷移
 */
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      // 新しいAPI層を使用
      const data = await login({ username, password });

      saveAuth({ username, token: data.token }, rememberMe);
      setStatus("success");
      setStatusMessage("ログインに成功しました。");
      navigate("/home");
    } catch (error) {
      console.error(error);
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      setStatusMessage(
        errorMessage.includes("username or password")
          ? "ユーザー名またはパスワードが正しくありません。"
          : "ログインに失敗しました。情報を確認して再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="ログイン"
      subtitle="登録したメールアドレスとパスワードを入力してください。"
      footerLabel="まだアカウントをお持ちでない方は"
      footerLinkLabel="新規登録"
      footerLinkTo="/signup"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="login-username"
          >
            ユーザー名
          </label>
          <input
            id="login-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="handwriter123"
            type="text"
            required
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="login-password"
          >
            パスワード
          </label>
          <input
            id="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            type="password"
            required
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="rounded border-slate-600 bg-slate-900/60 text-blue-500 focus:ring-blue-500/40"
            />
            ログイン状態を保持する
          </label>
          <button
            type="button"
            className="font-medium text-blue-300 hover:text-blue-200"
          >
            パスワードをお忘れですか？
          </button>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-blue-500 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-blue-400"
        >
          {isSubmitting ? "送信中..." : "サインイン"}
        </button>
        {status !== "idle" && (
          <p
            className={`text-sm text-center ${
              status === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {statusMessage}
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
