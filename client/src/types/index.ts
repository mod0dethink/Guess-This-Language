/**
 * 型定義の集約エクスポート
 * アプリケーション全体で使用する型定義を一箇所から再エクスポート
 * 他のファイルからは `import { User } from '@/types'` のようにインポート可能
 */

// ドメインモデルの型定義をエクスポート
// ユーザー、問題、リーダーボード、対戦結果などのデータ構造
export type {
  User,                 // ユーザー情報
  UserProfile,          // ユーザープロフィール
  UserRank,             // ユーザーランキング情報
  Question,             // テキスト問題
  AudioQuestion,        // 音声問題
  MatchQuestion,        // 対戦用問題（統一形式）
  LeaderboardEntry,     // リーダーボードエントリー
  MatchResult,          // 対戦結果
  RecapRound,           // ラウンド詳細
  StoredAuth,           // 認証情報（localStorage保存用）
  GameMode,             // ゲームモード（text-major, audio-rare等）
  QuestionType,         // 問題タイプ（text or audio）
  DifficultyLevel,      // 難易度（major or rare）
} from './models';

// APIリクエスト・レスポンスの型定義をエクスポート
// サーバーとの通信で使用するデータ構造
export type {
  SignupRequest,          // サインアップリクエスト
  LoginRequest,           // ログインリクエスト
  UpdateProfileRequest,   // プロフィール更新リクエスト
  SignupResponse,         // サインアップレスポンス
  LoginResponse,          // ログインレスポンス（JWT含む）
  UserProfileResponse,    // ユーザープロフィールレスポンス
  UserRankResponse,       // ユーザーランキングレスポンス
  QuestionsResponse,      // テキスト問題一覧レスポンス
  AudioQuestionsResponse, // 音声問題一覧レスポンス
  LeaderboardResponse,    // リーダーボードレスポンス
  ApiErrorResponse,       // APIエラーレスポンス
  ApiResponse,            // 汎用APIレスポンス型（成功またはエラー）
} from './api';

// APIエラー判定関数をエクスポート
// レスポンスがエラーかどうかを型安全に判定するヘルパー関数
export { isApiError } from './api';
