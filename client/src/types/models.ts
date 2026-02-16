/**
 * ドメインモデル型定義
 * アプリケーション全体で使用するデータモデルの型を定義
 * サーバーから受け取るデータやクライアント側で扱うデータの構造を記述
 */

// ===== User関連 =====

/**
 * ユーザー情報の型
 * ユーザーの基本情報を格納
 */
export interface User {
  id?: number;           // ユーザーID（任意、登録前は存在しない）
  username: string;      // ユーザー名（必須、一意）
  imageUrl?: string;     // プロフィール画像URL（任意）
  bio?: string;          // 自己紹介文（任意）
  rating: number;        // レーティング（必須、対戦成績に基づく）
}

/**
 * ユーザープロフィールの型
 * プロフィールページや他ユーザーの情報表示に使用
 */
export interface UserProfile {
  username: string;      // ユーザー名（必須）
  imageUrl?: string;     // プロフィール画像URL（任意）
  bio?: string;          // 自己紹介文（任意）
  rating?: number;       // レーティング（任意、公開プロフィールでは省略される場合あり）
}

/**
 * ユーザーランキング情報の型
 * リーダーボードや順位表示に使用
 */
export interface UserRank {
  rating: number;        // レーティング（必須）
  matchCount: number;    // 対戦回数（必須）
  rank?: number;         // 順位（任意、対戦回数が足りない場合は未定義）
}

// ===== Question関連 =====

/**
 * テキスト問題の型
 * オフライン練習モードやオンライン対戦で使用されるテキスト形式の問題
 */
export interface Question {
  id: number;           // 問題ID（一意）
  prompt: string;       // 問題文（言語サンプルテキスト）
  answer: string;       // 正解（言語名）
}

/**
 * 音声問題の型
 * オフライン練習モードの音声問題で使用
 */
export interface AudioQuestion {
  id: number;           // 問題ID（一意）
  language: string;     // 正解の言語名
  audioUrl: string;     // 音声ファイルのURL（Edge TTS生成）
}

/**
 * 対戦用問題の型
 * オンライン対戦モードで使用される問題形式
 * テキストまたは音声問題を統一的に扱う
 */
export interface MatchQuestion {
  id: number;           // 問題ID（一意）
  prompt?: string;      // 問題文（テキスト問題の場合のみ）
  answer: string;       // 正解（言語名）
  audioUrl?: string;    // 音声URL（音声問題の場合のみ）
  choices: string[];    // 選択肢の配列（4つの言語名）
}

// ===== Leaderboard関連 =====

/**
 * リーダーボードエントリーの型
 * リーダーボード画面で各ユーザーの情報を表示するために使用
 */
export interface LeaderboardEntry {
  rank: number;         // 順位（1位、2位、...）
  username: string;     // ユーザー名
  rating: number;       // レーティング
  imageUrl?: string;    // プロフィール画像URL（任意）
}

// ===== Match関連 =====

/**
 * 対戦結果の型
 * オンライン対戦終了後の結果画面で使用
 * 両プレイヤーのスコア、レーティング変動、各ラウンドの詳細を含む
 */
export interface MatchResult {
  opponent?: string;              // 対戦相手のユーザー名（任意）
  opponentImageUrl?: string;      // 対戦相手のプロフィール画像URL（任意）
  yourScore?: number;             // 自分のスコア（任意）
  opponentScore?: number;         // 相手のスコア（任意）
  yourDelta?: number;             // 自分のレーティング変動（任意、+10や-8など）
  opponentDelta?: number;         // 相手のレーティング変動（任意）
  yourName?: string;              // 自分のユーザー名（任意）
  yourCorrectCount?: number;      // 自分の正解数（任意）
  opponentCorrectCount?: number;  // 相手の正解数（任意）
  recapRounds?: RecapRound[];     // 各ラウンドの詳細情報（任意）
}

/**
 * ラウンド詳細の型
 * 対戦の各ラウンドの結果を記録
 */
export interface RecapRound {
  round: string;        // ラウンド番号（"1", "2", ...）
  lang: string;         // 出題された言語名
  mode: string;         // 問題タイプ（"text" or "audio"）
  ok: boolean;          // 正解したかどうか
  choice?: string | null;  // プレイヤーが選択した答え（任意、未回答の場合null）
  answer?: string;      // 正解の言語名（任意）
}

// ===== Auth関連 =====

/**
 * 認証情報の型
 * ローカルストレージに保存される認証情報
 */
export interface StoredAuth {
  username: string;     // ユーザー名
  token: string;        // JWTトークン（API認証に使用）
}

// ===== Game Mode =====

/**
 * ゲームモードの型
 * オフライン練習モードの種類を定義
 * - text-major: メジャー言語のテキスト問題
 * - text-rare: レア言語のテキスト問題
 * - audio-major: メジャー言語の音声問題
 * - audio-rare: レア言語の音声問題
 */
export type GameMode = 'text-major' | 'text-rare' | 'audio-major' | 'audio-rare';

/**
 * 問題タイプの型
 * テキスト問題か音声問題かを区別
 */
export type QuestionType = 'text' | 'audio';

/**
 * 難易度レベルの型
 * メジャー言語（よく使われる言語）かレア言語（珍しい言語）かを区別
 */
export type DifficultyLevel = 'major' | 'rare';
