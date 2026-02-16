/**
 * リーダーボードAPI
 * ランキング取得関連のAPI呼び出し
 */

import { apiFetch } from './client';
import type { LeaderboardResponse } from '../types';

/**
 * リーダーボード（上位プレイヤー）を取得
 */
export async function getLeaderboard(
  limit: number = 30
): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>(`/leaderboard?limit=${limit}`);
}
