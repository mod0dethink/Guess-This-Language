/**
 * オーディオ自動再生のアンロックユーティリティ
 * モバイルブラウザの自動再生ポリシーに対応するため、
 * ユーザーインタラクション時に無音のオーディオを再生してアンロックする
 */

/**
 * アンロック済みフラグ
 * 一度アンロックされたら、以降は処理をスキップする
 */
let unlocked = false;

/**
 * アンロック処理中のPromise
 * 複数回同時に呼ばれた場合、同じPromiseを返して重複実行を防ぐ
 */
let unlockPromise: Promise<void> | null = null;

/**
 * 無音のWAVファイル（Base64エンコード済み）
 * ブラウザの自動再生ポリシーをアンロックするために使用
 */
const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

/**
 * オーディオ自動再生をアンロック
 * iOS SafariやChrome等のモバイルブラウザでは、
 * ユーザーインタラクション（タップ等）がないとオーディオを再生できない。
 * この関数をユーザーインタラクション時に呼ぶことで、
 * 無音のオーディオを再生し、以降の自動再生を可能にする。
 */
export async function ensureAudioAutoplayUnlocked(): Promise<void> {
  // 既にアンロック済みならすぐ返す
  if (unlocked) return;
  // アンロック処理中なら、そのPromiseを返す（重複実行を防ぐ）
  if (unlockPromise) return unlockPromise;

  // アンロック処理を開始
  unlockPromise = (async () => {
    // 無音のオーディオ要素を作成
    const audio = new Audio(SILENT_WAV_DATA_URI);
    audio.muted = true;  // ミュート状態で再生（ユーザーには聞こえない）
    // モバイルSafari対応: インライン再生を有効化
    (audio as HTMLMediaElement & { playsInline?: boolean }).playsInline = true;
    try {
      // オーディオを再生（これでブラウザの自動再生ポリシーがアンロックされる）
      await audio.play();
      // すぐに停止して巻き戻し（実際には音を鳴らさない）
      audio.pause();
      audio.currentTime = 0;
      // アンロック完了フラグを立てる
      unlocked = true;
    } finally {
      // 処理完了後、Promiseをクリア
      unlockPromise = null;
    }
  })();

  return unlockPromise;
}
