/**
 * サインアップページコンポーネント
 * 新規ユーザー登録フォーム
 * ユーザー名とパスワードを入力してアカウント作成
 */

import { useState } from "react";
import type { FormEvent } from "react";
import AuthLayout from "../../components/AuthLayout";
import { signup } from "../../api";

/**
 * SignupPageコンポーネント
 * 新規ユーザー登録フォームの表示と登録処理
 * 成功時は成功メッセージを表示してログインページへの遷移を促す
 */
const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      // 新しいAPI層を使用
      await signup({ username, password });

      setStatus("success");
      setStatusMessage("アカウント作成に成功しました。ログインページへ移動してください。");
      setUsername("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      setStatusMessage(
        errorMessage.includes("already taken")
          ? "このユーザー名は既に使用されています。"
          : "アカウント作成に失敗しました。しばらくしてから再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="アカウント作成"
      subtitle="ユーザー名とパスワードを設定してください。"
      footerLabel="すでに登録済みの場合は"
      footerLinkLabel="ログイン"
      footerLinkTo="/login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="signup-username"
          >
            ユーザー名
          </label>
          <input
            id="signup-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="handwriter123"
            required
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor="signup-password"
          >
            パスワード
          </label>
          <input
            id="signup-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8文字以上"
            type="password"
            minLength={8}
            required
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-blue-500 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-blue-400"
        >
          {isSubmitting ? "送信中..." : "アカウントを作成"}
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

export default SignupPage;
