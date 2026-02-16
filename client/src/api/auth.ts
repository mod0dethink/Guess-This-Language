/**
 * 認証API
 * ログイン、サインアップ関連のAPI呼び出し
 */

import { apiFetch } from './client';
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
} from '../types';

/**
 * ユーザー登録
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return apiFetch<SignupResponse>('/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * ログイン
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
