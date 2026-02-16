/**
 * プログレスバーコンポーネント
 * 全てのモードで統一された滑らかなプログレスバー（RTL: 右から左）
 */

import { clampProgress } from '../lib/progress';

interface ProgressBarProps {
  /**
   * 進行度（0-100）
   */
  progress: number;

  /**
   * バーの色（デフォルト: primary）
   */
  color?: 'primary' | 'success' | 'danger';

  /**
   * 高さ（デフォルト: 8px）
   */
  height?: number;
}

const ProgressBar = ({ progress, color = 'primary', height = 8 }: ProgressBarProps) => {
  const colorClass = {
    primary: 'bg-primary shadow-[0_0_10px_#137fec]',
    success: 'bg-emerald-500 shadow-[0_0_10px_#10b981]',
    danger: 'bg-red-500 shadow-[0_0_10px_#ef4444]',
  }[color];

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-800/50"
      style={{ height: `${height}px` }}
    >
      <div
        className={`absolute right-0 top-0 h-full transition-all duration-75 ease-linear ${colorClass}`}
        style={{
          width: `${clampProgress(progress)}%`,
        }}
      />
    </div>
  );
};

export default ProgressBar;
