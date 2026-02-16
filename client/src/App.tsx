/**
 * アプリケーションのルートコンポーネント
 * ルーティング設定を読み込み、アプリケーション全体の構造を定義する
 */

import React from "react";
import Router from "./routes";

/**
 * Appコンポーネント
 * アプリケーション全体のルートとなるコンポーネント
 * Routerコンポーネントをレンダリングして、すべてのページへのルーティングを管理
 */
const App: React.FC = () => {
  return (
    <Router />
  );
};

export default App;
