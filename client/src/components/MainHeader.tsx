/**
 * メインヘッダーコンポーネント
 * アプリケーションロゴとユーザーアバターを表示
 * 一部のページ（オンライン対戦など）で使用
 */

/**
 * MainHeaderコンポーネントのプロパティ型
 */
type MainHeaderProps = {
  avatarUrl: string;  // ユーザーのアバター画像URL
};

/**
 * MainHeaderコンポーネント
 * 上部に固定されたヘッダーバー
 * 左側にアプリケーションロゴとタイトル、右側にユーザーアバターを表示
 * @param avatarUrl - ユーザーのプロフィール画像URL
 */
const MainHeader = ({ avatarUrl }: MainHeaderProps) => {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-800 bg-background-dark px-6 py-3 lg:px-10"
      style={{ fontFamily: '"Lexend", sans-serif' }}
    >
      <div className="flex items-center gap-4 text-slate-50">
        <div className="size-8 text-primary">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight">
          GuessThisLanguage
        </h2>
      </div>
      <div className="flex flex-1 items-center justify-end">
        <div
          className="aspect-square size-10 rounded-full border-2 border-primary bg-cover bg-center"
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
      </div>
    </header>
  );
};

export default MainHeader;
