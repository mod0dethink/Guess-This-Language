/**
 * ユーザーAPI
 * プロフィール取得・更新、ランク取得関連のAPI呼び出し
 */

import { apiFetch } from './client';
import type {
  UserProfileResponse,
  UserRankResponse,
  UpdateProfileRequest,
} from '../types';

/**
 * 自分のプロフィールを取得
 */
export async function getMyProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/users/me', {
    requireAuth: true,
  });
}

/**
 * 自分のランク情報を取得
 */
export async function getMyRank(): Promise<UserRankResponse> {
  return apiFetch<UserRankResponse>('/users/me/rank', {
    requireAuth: true,
  });
}

/**
 * プロフィールを更新
 */
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/users/me/profile', {
    method: 'PATCH',
    requireAuth: true,
    body: JSON.stringify(data),
  });
}

/**
 * プロフィール画像のみ更新
 */
export async function updateAvatar(imageUrl: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/users/me/image', {
    method: 'PUT',
    requireAuth: true,
    body: JSON.stringify({ imageUrl }),
  });
}

/**
 * 公開プロフィールを取得
 */
export async function getPublicProfile(
  username: string
): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>(`/users/${username}`);
}
