/**
 * 認証情報の管理ユーティリティ
 * LocalStorageまたはSessionStorageに認証トークンを保存・取得する
 * ログイン時の「ログイン状態を保持する」チェックボックスに対応
 */

/**
 * 保存される認証情報の型
 */
type StoredAuth = {
  username: string;  // ユーザー名
  token: string;     // JWT認証トークン
};

/**
 * LocalStorageに保存する際のキー名
 */
const AUTH_KEY = "gtl.auth";

/**
 * remember値に基づいてストレージを選択
 * @param remember - trueならlocalStorage、falseならsessionStorage
 * @returns 選択されたストレージオブジェクト
 */
const getStorage = (remember: boolean) => {
  return remember ? window.localStorage : window.sessionStorage;
};

/**
 * 認証情報を保存
 * remember=trueならlocalStorage、falseならsessionStorageに保存
 * 保存時、もう一方のストレージからは削除する（重複を防ぐ）
 * @param data - 保存する認証情報（ユーザー名とトークン）
 * @param remember - ログイン状態を保持するか（trueならlocalStorage）
 */
export const saveAuth = (data: StoredAuth, remember: boolean) => {
  // remember値に応じてストレージを選択
  const storage = getStorage(remember);
  // 認証情報をJSON形式で保存
  storage.setItem(AUTH_KEY, JSON.stringify(data));
  // もう一方のストレージから削除（localStorage/sessionStorageのどちらか片方のみに保存）
  const other = remember ? window.sessionStorage : window.localStorage;
  other.removeItem(AUTH_KEY);
};

/**
 * 認証情報を取得
 * localStorageとsessionStorageの両方を確認し、存在する方を返す
 * @returns 認証情報、または存在しない場合はnull
 */
export const getAuth = (): StoredAuth | null => {
  // localStorageとsessionStorageの両方を確認（??演算子で片方にあれば取得）
  const raw =
    window.localStorage.getItem(AUTH_KEY) ??
    window.sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    // JSON文字列をパースして認証情報オブジェクトに変換
    return JSON.parse(raw) as StoredAuth;
  } catch {
    // パース失敗時はnullを返す（不正なデータが保存されていた場合）
    return null;
  }
};

/**
 * 認証情報を削除
 * ログアウト時に呼ばれる
 * localStorageとsessionStorageの両方から削除
 */
export const clearAuth = () => {
  window.localStorage.removeItem(AUTH_KEY);
  window.sessionStorage.removeItem(AUTH_KEY);
};
