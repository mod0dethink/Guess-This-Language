/**
 * ユーザープロフィールの管理ユーティリティ
 * LocalStorageにプロフィール情報を保存し、カスタムイベントで更新を通知
 * 複数コンポーネント間でプロフィール情報を同期するための仕組み
 */

import { useEffect, useState } from "react";

/**
 * ユーザープロフィールの型
 * LocalStorageに保存するプロフィール情報
 */
export type UserProfile = {
  username?: string;  // ユーザー名
  imageUrl?: string;  // プロフィール画像URL
  bio?: string;       // 自己紹介文
  rating?: number;    // レーティング
};

/**
 * LocalStorageに保存する際のキー名
 */
const PROFILE_KEY = "gtl.profile";

/**
 * プロフィール更新イベント名
 * このカスタムイベントを使ってプロフィール変更を各コンポーネントに通知
 */
const PROFILE_EVENT = "gtl.profile.updated";

/**
 * LocalStorageからプロフィール情報を取得
 * @returns プロフィール情報、または存在しない場合は空オブジェクト
 */
export const getStoredProfile = (): UserProfile => {
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return {};
  try {
    // JSON文字列をパースしてプロフィールオブジェクトに変換
    return JSON.parse(raw) as UserProfile;
  } catch {
    // パース失敗時は空オブジェクトを返す
    return {};
  }
};

/**
 * プロフィール情報を保存
 * 既存のデータとマージして保存し、カスタムイベントで更新を通知
 * @param patch - 更新するプロフィール情報（部分的でもOK）
 */
export const setStoredProfile = (patch: UserProfile) => {
  // 既存のデータを読み込み
  const current = getStoredProfile();
  // 新しいデータとマージ（既存フィールドは上書き）
  const next = { ...current, ...patch };
  // LocalStorageに保存
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  // カスタムイベントを発火して全てのuseProfile()フックに更新を通知
  window.dispatchEvent(new Event(PROFILE_EVENT));
};

/**
 * プロフィール情報を監視するカスタムフック
 * プロフィールが更新されると自動的に再レンダリングされる
 * @returns 現在のプロフィール情報
 */
export const useProfile = () => {
  // 初期値としてLocalStorageから読み込み
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());

  useEffect(() => {
    // プロフィール更新イベントのハンドラー
    const handler = () => setProfile(getStoredProfile());
    // イベントリスナーを登録
    window.addEventListener(PROFILE_EVENT, handler);
    // クリーンアップ: コンポーネントアンマウント時にリスナーを解除
    return () => window.removeEventListener(PROFILE_EVENT, handler);
  }, []);

  return profile;
};
