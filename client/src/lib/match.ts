/**
 * オンライン対戦結果の管理ユーティリティ
 * 対戦終了後の結果情報をLocalStorageに保存・取得する
 * 結果画面（勝利/敗北）で表示するデータを永続化
 */

/**
 * 対戦結果の型
 * WebSocketから受け取る対戦結果データをそのまま保存
 */
export type LastMatch = {
  opponent?: string;              // 対戦相手のユーザー名
  opponentImageUrl?: string;      // 対戦相手のプロフィール画像URL
  yourScore?: number;             // 自分のスコア
  opponentScore?: number;         // 相手のスコア
  yourDelta?: number;             // 自分のレーティング変動（+10や-8など）
  opponentDelta?: number;         // 相手のレーティング変動
  yourName?: string;              // 自分のユーザー名
  yourCorrectCount?: number;      // 自分の正解数
  opponentCorrectCount?: number;  // 相手の正解数
  recapRounds?: {                 // 各ラウンドの詳細情報
    round: string;                // ラウンド番号（"1", "2", ...）
    lang: string;                 // 出題された言語名
    mode: string;                 // 問題タイプ（"text" or "audio"）
    ok: boolean;                  // 正解したかどうか
    choice?: string | null;       // プレイヤーが選択した答え
    answer?: string;              // 正解の言語名
  }[];
};

/**
 * LocalStorageに保存する際のキー名
 */
const LAST_MATCH_KEY = "gtl.lastMatch";

/**
 * 対戦結果を保存
 * 既存のデータとマージして保存（部分更新可能）
 * @param match - 保存する対戦結果データ（部分的でもOK）
 */
export const saveLastMatch = (match: LastMatch) => {
  // 既存のデータを読み込み
  const current = loadLastMatch();
  // 新しいデータとマージ（既存フィールドは上書き）
  const next = { ...current, ...match };
  // LocalStorageに保存
  window.localStorage.setItem(LAST_MATCH_KEY, JSON.stringify(next));
};

/**
 * 対戦結果を取得
 * LocalStorageから最後の対戦結果を読み込む
 * @returns 対戦結果データ、または存在しない場合は空オブジェクト
 */
export const loadLastMatch = (): LastMatch => {
  const raw = window.localStorage.getItem(LAST_MATCH_KEY);
  if (!raw) return {};
  try {
    // JSON文字列をパースして対戦結果オブジェクトに変換
    return JSON.parse(raw) as LastMatch;
  } catch {
    // パース失敗時は空オブジェクトを返す
    return {};
  }
};
