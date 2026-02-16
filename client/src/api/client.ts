/**
 * API クライアント設定
 * 共通のfetch設定、エラーハンドリング、認証ヘッダー管理
 */

import { getAuth } from '../lib/auth';
import type { ApiErrorResponse } from '../types';

// ベースURL取得
export const getBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  return envUrl && envUrl.length > 0 ? envUrl : 'http://localhost:8000';
};

// エラーレスポンスのチェック
export function isErrorResponse(data: any): data is ApiErrorResponse {
  return data && typeof data.error === 'string';
}

// 共通fetch設定
export interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * 共通fetchラッパー
 * - ベースURL自動付与
 * - 認証ヘッダー自動付与
 * - エラーハンドリング統一
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = false, headers = {}, ...restOptions } = options;

  const url = `${getBaseUrl()}${endpoint}`;

  // 認証ヘッダーの追加
  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requireAuth) {
    const auth = getAuth();
    if (!auth?.token) {
      throw new Error('認証が必要です');
    }
    (finalHeaders as Record<string, string>)['Authorization'] = `Bearer ${auth.token}`;
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: finalHeaders,
  });

  // レスポンスのパース
  const data = await response.json();

  // エラーハンドリング
  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new Error(data.error);
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return data as T;
}
