/**
 * アプリケーションのエントリーポイント
 * Reactアプリケーションを初期化し、DOMにマウントする
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {BrowserRouter} from "react-router-dom";

// ルート要素を取得してReactアプリケーションをレンダリング
// StrictModeで開発時の潜在的な問題を検出
// BrowserRouterでクライアントサイドルーティングを有効化
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </StrictMode>,
)
