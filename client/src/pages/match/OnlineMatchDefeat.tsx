/**
 * オンライン対戦敗北ページコンポーネント
 * 対戦に敗北した際の結果画面
 * スコア、レーティング変動、各ラウンドの詳細を表示
 */

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MatchResultScreen from '../../components/MatchResultScreen';
import { useProfile } from '../../lib/profile';
import { getAuth } from '../../lib/auth';
import { loadLastMatch } from '../../lib/match';
import { DEFAULT_AVATAR } from '../../constants';

/**
 * OnlineMatchDefeatコンポーネント
 * 敗北時の結果画面を表示
 * location.stateまたはLocalStorageから対戦結果データを取得
 * 再戦またはホームへの遷移ボタンを提供
 */
const OnlineMatchDefeat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useProfile();
  const auth = getAuth();
  const youName = profile.username || auth?.username || "YOU";
  const state = (location.state || {}) as {
    opponent?: string;
    opponentImageUrl?: string;
    yourScore?: number;
    opponentScore?: number;
    yourDelta?: number;
    opponentDelta?: number;
    yourName?: string;
    yourCorrectCount?: number;
    opponentCorrectCount?: number;
    recapRounds?: {
      round: string;
      lang: string;
      mode: string;
      ok: boolean;
      choice?: string | null;
      answer?: string;
    }[];
  };
  const lastMatch = loadLastMatch();
  const matchMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") ?? "text-rare";
  }, []);

  const matchLabel =
    matchMode.includes("major") ? "Ranked Match • Major" : "Ranked Match • Rare";

  const resolvedYouName =
    state.yourName || lastMatch.yourName || youName || "YOU";
  const opponentName = state.opponent || lastMatch.opponent || "OPPONENT";
  const yourScore = state.yourScore ?? lastMatch.yourScore ?? 1830;
  const opponentScore = state.opponentScore ?? lastMatch.opponentScore ?? 2450;
  const yourDelta = state.yourDelta ?? lastMatch.yourDelta ?? 0;
  const opponentDelta = state.opponentDelta ?? lastMatch.opponentDelta ?? 0;
  const yourTrend: "up" | "down" = yourDelta >= 0 ? "up" : "down";
  const opponentTrend: "up" | "down" = opponentDelta >= 0 ? "up" : "down";
  const yourCorrect =
    state.yourCorrectCount ?? lastMatch.yourCorrectCount ?? 0;
  const oppCorrect =
    state.opponentCorrectCount ?? lastMatch.opponentCorrectCount ?? 0;
  return (
    <MatchResultScreen
      variant="defeat"
      matchLabel={matchLabel}
      headline="DEFEAT"
      subline={
        <>
          Lost <span className="text-white">{yourCorrect} – {oppCorrect}</span> against{" "}
          <span className="text-white">{opponentName}</span>
        </>
      }
      you={{
        name: resolvedYouName,
        score: String(yourScore),
        rpDelta: {
          value: `${yourDelta >= 0 ? "+" : ""}${yourDelta} RP`,
          trend: yourTrend,
        },
        avatarUrl: profile.imageUrl || DEFAULT_AVATAR,
        isWinner: false,
        isYou: true,
      }}
      opponent={{
        name: opponentName,
        score: String(opponentScore),
        rpDelta: {
          value: `${opponentDelta >= 0 ? "+" : ""}${opponentDelta} RP`,
          trend: opponentTrend,
        },
        avatarUrl:
          state.opponentImageUrl ||
          lastMatch.opponentImageUrl ||
          DEFAULT_AVATAR,
        isWinner: true,
        isYou: false,
      }}
      recapRounds={
        state.recapRounds && state.recapRounds.length > 0
          ? state.recapRounds
          : lastMatch.recapRounds ?? []
      }
      roundsLabel={
        state.recapRounds && state.recapRounds.length > 0
          ? `${state.recapRounds.length} Rounds`
          : lastMatch.recapRounds && lastMatch.recapRounds.length > 0
            ? `${lastMatch.recapRounds.length} Rounds`
            : "10 Rounds"
      }
      onPlayAgain={() => {
        navigate(`/online/text?mode=${matchMode}`);
      }}
      onHome={() => {
        navigate("/home");
      }}
    />
  );
};

export default OnlineMatchDefeat;
