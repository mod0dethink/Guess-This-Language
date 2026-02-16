/**
 * API リクエスト・レスポンス型定義
 * サーバーとの通信で使用するデータ構造を定義
 * リクエストボディとレスポンスボディの型を明確に記述
 */

import type {
  Question,
  AudioQuestion,
  LeaderboardEntry,
} from './models';

// ===== Request Types（リクエスト型） =====

/**
 * サインアップリクエストの型
 * POST /api/signup で送信するリクエストボディ
 */
export interface SignupRequest {
  username: string;  // ユーザー名（必須、一意）
  password: string;  // パスワード（必須、サーバー側でハッシュ化）
}

/**
 * ログインリクエストの型
 * POST /api/login で送信するリクエストボディ
 */
export interface LoginRequest {
  username: string;  // ユーザー名（必須）
  password: string;  // パスワード（必須、サーバー側で検証）
}

/**
 * プロフィール更新リクエストの型
 * PATCH /api/me で送信するリクエストボディ（部分更新）
 */
export interface UpdateProfileRequest {
  imageUrl?: string;  // プロフィール画像URL（任意）
  bio?: string;       // 自己紹介文（任意）
}

// ===== Response Types（レスポンス型） =====

/**
 * サインアップレスポンスの型
 * POST /api/signup のレスポンスボディ
 */
export interface SignupResponse {
  id: number;        // 新規作成されたユーザーのID
  username: string;  // 登録されたユーザー名
}

/**
 * ログインレスポンスの型
 * POST /api/login のレスポンスボディ
 */
export interface LoginResponse {
  token: string;  // JWT認証トークン（以降のAPIリクエストで使用）
}

/**
 * ユーザープロフィールレスポンスの型
 * GET /api/me のレスポンスボディ
 */
export interface UserProfileResponse {
  username: string;  // ユーザー名
  imageUrl: string;  // プロフィール画像URL
  bio: string;       // 自己紹介文
  rating: number;    // レーティング
}

/**
 * ユーザーランキングレスポンスの型
 * GET /api/me/rank のレスポンスボディ
 */
export interface UserRankResponse {
  rating: number;       // レーティング（必須）
  matchCount: number;   // 対戦回数（必須）
  rank?: number;        // 順位（任意、対戦回数が足りない場合は未定義）
}

/**
 * テキスト問題一覧レスポンスの型
 * GET /api/questions のレスポンスボディ
 */
export interface QuestionsResponse {
  questions: Question[];  // テキスト問題の配列
}

/**
 * 音声問題一覧レスポンスの型
 * GET /api/audio-questions のレスポンスボディ
 */
export interface AudioQuestionsResponse {
  questions: AudioQuestion[];  // 音声問題の配列
}

/**
 * リーダーボードレスポンスの型
 * GET /api/leaderboard のレスポンスボディ
 */
export interface LeaderboardResponse {
  leaders: LeaderboardEntry[];  // リーダーボードエントリーの配列
}

// ===== API Error Response（エラーレスポンス） =====

/**
 * APIエラーレスポンスの型
 * サーバーからエラーが返された場合の共通形式
 */
export interface ApiErrorResponse {
  error: string;  // エラーメッセージ（例: "username already taken"）
}

// ===== Generic API Response（汎用APIレスポンス） =====

/**
 * 汎用APIレスポンス型
 * 成功時は型Tのデータ、失敗時はApiErrorResponseを返す
 */
export type ApiResponse<T> = T | ApiErrorResponse;

/**
 * APIエラー判定関数
 * レスポンスがエラーかどうかを型安全に判定
 * @param response - APIレスポンス
 * @returns エラーレスポンスの場合true、成功レスポンスの場合false
 */
export function isApiError(response: any): response is ApiErrorResponse {
  return response && typeof response.error === 'string';
}
