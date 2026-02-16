/**
 * オンライン対戦ページコンポーネント
 * WebSocketを使用したリアルタイム対戦機能
 * マッチング待機画面 → バトル画面 → 結果画面 の流れ
 * テキスト問題と音声問題の両方に対応
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MatchBattleScreen from '../../components/MatchBattleScreen';
import MatchWaitingScreen from '../../components/MatchWaitingScreen';
import { getAuth } from '../../lib/auth';
import { useProfile } from '../../lib/profile';
import { saveLastMatch } from '../../lib/match';
import { useAudioPlayer, useRoundProgress } from '../../hooks';
import { ROUND_SECONDS, MATCH_STATUS, DEFAULT_AVATAR } from '../../constants';

/**
 * WebSocketペイロードの型
 */
type WsPayload = {
  [key: string]: unknown;
};

/**
 * WebSocketメッセージの型
 */
type WsMessage = {
  type: string;          // メッセージタイプ（"queued", "round", "result", "finished"等）
  payload?: WsPayload;   // メッセージデータ
};

/**
 * 問題データの型
 */
type QuestionPayload = {
  id: number;
  prompt: string;
  answer?: string;
  choices?: string[];
  audioUrl?: string;
};

/**
 * ラウンド開始時のペイロード型
 */
type RoundPayload = {
  roomId: string;                   // ルームID
  opponent: string;                 // 対戦相手のユーザー名
  opponentImageUrl?: string;        // 対戦相手のアバター画像URL
  question: QuestionPayload;        // 出題される問題
  round: number;                    // 現在のラウンド番号
  totalRounds: number;              // 総ラウンド数
  scores: Record<string, number>;   // 各プレイヤーのスコア
};

/**
 * ラウンド結果のペイロード型
 */
type ResultPayload = {
  roomId: string;                      // ルームID
  status: string;                      // ステータス
  round?: number;                      // ラウンド番号
  scores?: Record<string, number>;     // スコア
  correct?: Record<string, boolean>;   // 各プレイヤーの正誤
  answers?: Record<string, string>;    // 各プレイヤーの回答
  answer?: string;                     // 正解
  winner?: string;                     // ラウンド勝者
};

/**
 * 対戦終了時のペイロード型
 */
type FinishedPayload = {
  roomId: string;                                                           // ルームID
  winner?: string;                                                          // 勝者
  scores: Record<string, number>;                                           // 最終スコア
  status: string;                                                           // ステータス
  recap?: { round: string; prompt: string; winner?: string; status: string }[];  // 各ラウンドの詳細
  ratings?: Record<string, number>;                                         // 更新後のレーティング
  deltas?: Record<string, number>;                                          // レーティング変動
};

/**
 * WebSocket接続URLを取得
 * 環境変数または開発サーバーのデフォルトURLを返す
 */
const getWsUrl = () => {
  const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) return envUrl;
  return "ws://localhost:8000/ws";
};

const STATUS = MATCH_STATUS;

const OnlineTextMatch: React.FC = () => {
  const navigate = useNavigate();
  const matchMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") ?? "";
  }, []);
  const wsRef = useRef<WebSocket | null>(null);
  const waitingTimerRef = useRef<number | null>(null);
  const autoJoinRef = useRef(false);
  const [username] = useState(() => getAuth()?.username ?? "");
  const [token] = useState(() => getAuth()?.token ?? "");
  const profile = useProfile();
  const [status, setStatus] = useState<typeof STATUS[keyof typeof STATUS]>(STATUS.connecting);
  const [, setQueued] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [opponent, setOpponent] = useState("");
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [, setTotalRounds] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [opponentAvatar, setOpponentAvatar] = useState<string>("");
  const opponentAvatarRef = useRef<string>("");
  const opponentRef = useRef<string>("");
  const [, setRecapRounds] = useState<
    {
      round: string;
      lang: string;
      mode: string;
      ok: boolean;
      choice?: string | null;
      answer?: string;
    }[]
  >([]);
  const recapRoundsRef = useRef<
    {
      round: string;
      lang: string;
      mode: string;
      ok: boolean;
      choice?: string | null;
      answer?: string;
    }[]
  >([]);
  const [lastResult, setLastResult] = useState("");
  const [, setLog] = useState<string[]>([]);
  const [, setConnected] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [audioStatus, setAudioStatus] = useState<
    "idle" | "playing" | "waiting" | "needsClick"
  >("idle");
  const [roundFeedback, setRoundFeedback] = useState<{
    choice: string | null;
    correctLabel: string;
    status: "correct" | "wrong" | "timeout";
  } | null>(null);
  const lastAnswerRef = useRef<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const pendingRoundRef = useRef<RoundPayload | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const countdownDoneRef = useRef(false);
  const [timerRunning, setTimerRunning] = useState(false);

  const isWaiting = !roomId && status !== STATUS.active && countdown === null;
  const battleLabels = (() => {
    switch (matchMode) {
      case "text-major":
        return {
          modeLabel: "Text Mode",
          difficultyLabel: "Major Difficulty",
          challengeTitle: "Analyze the Text Snippet",
          mediaType: "text" as const,
        };
      case "text-rare":
        return {
          modeLabel: "Text Mode",
          difficultyLabel: "Rare Difficulty",
          challengeTitle: "Analyze the Text Snippet",
          mediaType: "text" as const,
        };
      case "audio-major":
        return {
          modeLabel: "Audio Mode",
          difficultyLabel: "Major Difficulty",
          challengeTitle: "Analyze the Audio Clip",
          mediaType: "audio" as const,
        };
      case "audio-rare":
        return {
          modeLabel: "Audio Mode",
          difficultyLabel: "Rare Difficulty",
          challengeTitle: "Analyze the Audio Clip",
          mediaType: "audio" as const,
        };
      default:
        return {
          modeLabel: "Text Mode",
          difficultyLabel: "Rare Difficulty",
          challengeTitle: "Analyze the Text Snippet",
          mediaType: "text" as const,
        };
    }
  })();
  const isAudioMode = matchMode.startsWith("audio-");

  const addLog = (message: string) => {
    setLog((prev) => [
      `${new Date().toLocaleTimeString()} ${message}`,
      ...prev,
    ].slice(0, 8));
  };

  const stopWaitingTimer = () => {
    if (waitingTimerRef.current !== null) {
      window.clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
  };

  // 音声再生フック (onEndedはaudio要素で直接処理)
  const { audioRef, play: playAudioFile, stop: stopAudioFile } = useAudioPlayer({
    onPlay: () => setAudioStatus("playing"),
    onError: () => {
      setAudioStatus("needsClick");
      // Audio failed (e.g., autoplay blocked), but still start countdown to keep clients synced
      // Only start countdown if we're in an active match with a question
      if (status === STATUS.active && question) {
        setAudioStatus("waiting");
        setTimerRunning(true);
      }
    },
    baseUrl: (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:8000',
  });

  const stopAudio = () => {
    stopAudioFile();
  };

  const playAudio = (url: string) => {
    setTimerRunning(false);
    setAudioStatus("playing");
    setRoundFeedback(null);
    lastAnswerRef.current = null;
    playAudioFile(url);
  };

  // プログレスバー管理フック
  // テキストモード: status === active かつ feedback なし
  // オーディオモード: さらに audioStatus === "waiting" が必要
  const running = status === STATUS.active && !roundFeedback && (
    isAudioMode ? audioStatus === "waiting" : true
  );

  const { progress } = useRoundProgress({
    durationMs: ROUND_SECONDS * 1000,
    running,
    resetKey: currentRound,
    onComplete: () => {
      // タイムアウト時の処理はサーバー側で行われる
    },
  });

  useEffect(() => {
    if (!username || !token) {
      navigate("/login");
    }
    return () => {
      stopAudio();
      stopWaitingTimer();
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [navigate, token, username]);

  useEffect(() => {
    if (!username || !token) return;
    if (autoJoinRef.current) return;
    autoJoinRef.current = true;
    const ws = connectIfNeeded();
    if (ws.readyState === WebSocket.OPEN) {
      sendJoin(ws);
    }
  }, [token, username]);

  useEffect(() => {
    if (!isWaiting) {
      stopWaitingTimer();
      setWaitingSeconds(0);
      return;
    }

    stopWaitingTimer();
    waitingTimerRef.current = window.setInterval(() => {
      setWaitingSeconds((prev) => prev + 1);
    }, 1000);
    return () => stopWaitingTimer();
  }, [isWaiting]);

  const updateFromRound = (payload: RoundPayload) => {
    setRoomId(payload.roomId);
    setOpponent(payload.opponent);
    opponentRef.current = payload.opponent;
    const nextAvatar = payload.opponentImageUrl ?? "";
    setOpponentAvatar(nextAvatar);
    opponentAvatarRef.current = nextAvatar;
    setQuestion(payload.question);
    setRoundFeedback(null);
    lastAnswerRef.current = null;
    setAnswerLocked(false);
    setCurrentRound(payload.round);
    setTotalRounds(payload.totalRounds);
    setScores(payload.scores);
    setStatus(STATUS.active);
    if (payload.opponent) {
      saveLastMatch({
        opponent: payload.opponent,
        opponentImageUrl: nextAvatar,
        yourScore: payload.scores[username] ?? 0,
        opponentScore: payload.scores[payload.opponent] ?? 0,
        yourName: username,
      });
    }
    if (isAudioMode) {
      const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
      const rawUrl = payload.question.audioUrl ?? "";
      const resolvedUrl = rawUrl.startsWith("http")
        ? rawUrl
        : `${baseUrl && baseUrl.length > 0 ? baseUrl : "http://localhost:8000"}${rawUrl}`;
      if (rawUrl) {
        playAudio(resolvedUrl);
      } else {
        setAudioStatus("needsClick");
      }
    } else {
      setTimerRunning(true);
    }
  };

  const handleMessage = (message: WsMessage) => {
    switch (message.type) {
      case "welcome":
        setStatus(STATUS.connecting);
        addLog("サーバーに接続しました。");
        return;
      case "match:queued":
        setQueued(true);
        setStatus(STATUS.queued);
        addLog("マッチングキューに参加しました。");
        return;
      case "match:preparing":
        setQueued(false);
        setStatus(STATUS.preparing);
        addLog("対戦相手を準備中です。");
        return;
      case "match:started":
      case "match:round": {
        const payload = message.payload as RoundPayload;
        console.log("[match round]", payload);
        setQueued(false);
        // First round: show countdown. Subsequent rounds: apply immediately.
        if (!countdownDoneRef.current) {
          countdownDoneRef.current = true;
          pendingRoundRef.current = payload;
          setOpponent(payload.opponent);
          opponentRef.current = payload.opponent;
          const nextAvatar = payload.opponentImageUrl ?? "";
          setOpponentAvatar(nextAvatar);
          opponentAvatarRef.current = nextAvatar;
          setCountdown(3);
          let tick = 3;
          countdownTimerRef.current = window.setInterval(() => {
            tick -= 1;
            if (tick <= 0) {
              if (countdownTimerRef.current !== null) {
                window.clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
              }
              setCountdown(null);
              if (pendingRoundRef.current) {
                updateFromRound(pendingRoundRef.current);
                pendingRoundRef.current = null;
              }
            } else {
              setCountdown(tick);
            }
          }, 1000);
        } else {
          updateFromRound(payload);
        }
        addLog("対戦が開始しました。");
        return;
      }
      case "match:result": {
        const payload = message.payload as ResultPayload;
        if (payload.scores) {
          setScores(payload.scores);
        }
        const roundLabel = String(payload.round ?? 0).padStart(2, "0");
        const questionLabel = question?.prompt || question?.answer || "Unknown";
        const correctAnswer = payload.answer ?? question?.answer ?? "";
        const resolvedYourName = username || profile.username || "YOU";
        const chosenAnswer =
          payload.answers?.[resolvedYourName] ??
          payload.answers?.[username] ??
          lastAnswerRef.current ??
          null;
        const ok =
          payload.correct?.[resolvedYourName] ??
          payload.correct?.[username] ??
          false;
        const prevRecap = recapRoundsRef.current;
        if (!prevRecap.some((entry) => entry.round === roundLabel)) {
          const next = [
            ...prevRecap,
            {
              round: roundLabel,
              lang: questionLabel,
              mode: "",
              ok,
              choice: chosenAnswer,
              answer: correctAnswer,
            },
          ];
          recapRoundsRef.current = next;
          setRecapRounds(next);
          saveLastMatch({ recapRounds: next });
        }
        if (payload.status === "round_end") {
          setLastResult(ok ? "✓ Correct!" : `✗ Wrong! Answer: ${correctAnswer}`);
          setTimerRunning(false);
        } else if (payload.status === "closed") {
          setLastResult("Round closed");
          setTimerRunning(false);
        }
        const userChoice = lastAnswerRef.current;
        const correctLabel = payload.answer ?? question?.answer ?? "";
        const nextStatus = ok ? "correct" : "wrong";
        setRoundFeedback({
          choice: userChoice,
          correctLabel,
          status: nextStatus,
        });
        if (isAudioMode) {
          stopAudio();
        }
        addLog(`結果: ${payload.status}`);
        return;
      }
      case "match:finished": {
        const payload = message.payload as FinishedPayload;
        setStatus(STATUS.finished);
        setQuestion(null);
        setRoomId(payload.roomId);
        setScores(payload.scores);
        setTimerRunning(false);
        setAudioStatus("idle");
        stopAudio();
        setLastResult(payload.winner ? `勝者: ${payload.winner}` : "引き分け");
        addLog("対戦が終了しました。");
        const resolvedOpponentAvatar =
          opponentAvatarRef.current || opponentAvatar;
        const resolvedOpponentName = opponentRef.current || opponent;
        const resolvedYourName = username || profile.username || "YOU";
        const recap =
          recapRoundsRef.current.length > 0
            ? recapRoundsRef.current
            : payload.recap?.map((item) => ({
                round: item.round,
                lang: item.prompt,
                mode: "",
                ok: item.winner === resolvedYourName,
              })) ?? [];
        const ratings = payload.ratings ?? {};
        const deltas = payload.deltas ?? {};
        const payloadState = {
          opponent: resolvedOpponentName,
          opponentImageUrl: resolvedOpponentAvatar,
          yourScore: ratings[resolvedYourName] ?? scores[username] ?? 0,
          opponentScore:
            ratings[resolvedOpponentName] ?? scores[resolvedOpponentName] ?? 0,
          yourDelta: deltas[resolvedYourName] ?? 0,
          opponentDelta: deltas[resolvedOpponentName] ?? 0,
          yourName: resolvedYourName,
          yourCorrectCount:
            payload.scores[resolvedYourName] ??
            payload.scores[username] ??
            0,
          opponentCorrectCount:
            payload.scores[resolvedOpponentName] ?? 0,
          recapRounds: recap,
        };
        saveLastMatch(payloadState);
        // Pass full mode (e.g. "text-major", "audio-rare") so result pages can navigate back correctly
        if (payload.winner && payload.winner === username) {
          navigate(`/online/victory?mode=${matchMode}`, {
            state: payloadState,
          });
        } else if (payload.winner && payload.winner !== username) {
          navigate(`/online/defeat?mode=${matchMode}`, {
            state: payloadState,
          });
        } else {
          navigate(`/online/victory?mode=${matchMode}`, {
            state: payloadState,
          });
        }
        return;
      }
      case "match:ended":
        setStatus(STATUS.finished);
        setQueued(false);
        setQuestion(null);
        setTimerRunning(false);
        setAudioStatus("idle");
        stopAudio();
        addLog("対戦がキャンセルされました。");
        return;
      case "error":
        setStatus(STATUS.error);
        addLog(
          `エラー: ${(message.payload as { message?: string })?.message ?? "unknown"}`
        );
        return;
      default:
        addLog(`未対応イベント: ${message.type}`);
    }
  };

  const connectIfNeeded = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    setStatus(STATUS.connecting);
    setConnected(false);

    ws.onopen = () => {
      setConnected(true);
      addLog("ソケット接続が確立しました。");
      if (username.trim() && token.trim()) {
        sendJoin(ws);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        handleMessage(data);
      } catch {
        addLog("不正なメッセージを受信しました。");
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setQueued(false);
      setStatus(STATUS.closed);
      addLog("接続が切断されました。");
    };

    ws.onerror = () => {
      setStatus(STATUS.error);
    };

    return ws;
  };

  const sendJoin = (ws: WebSocket) => {
    ws.send(
      JSON.stringify({
        type: "match:join",
        payload: { token, mode: matchMode || "text-major" },
      })
    );
    setQueued(true);
    setStatus(STATUS.queued);
  };

  const handleAnswer = (value: string) => {
    if (!roomId || !value.trim()) return;
    if (isAudioMode && audioStatus !== "waiting") return;
    if (isAudioMode && roundFeedback) return;
    if (answerLocked) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    lastAnswerRef.current = value.trim();
    setAnswerLocked(true);
    wsRef.current.send(
      JSON.stringify({
        type: "match:answer",
        payload: { roomId, answer: value.trim() },
      })
    );
  };

  const waitingMinutes = String(Math.floor(waitingSeconds / 60)).padStart(2, "0");
  const waitingSecs = String(waitingSeconds % 60).padStart(2, "0");

  const waitingTitle = (() => {
    switch (matchMode) {
      case "text-major":
        return "Finding opponents for Text - Major Mode...";
      case "text-rare":
        return "Finding opponents for Text - Rare Mode...";
      case "audio-major":
        return "Finding opponents for Audio - Major Mode...";
      case "audio-rare":
        return "Finding opponents for Audio - Rare Mode...";
      default:
        return "Finding opponents...";
    }
  })();

  const choiceLabels = question?.choices?.length
    ? question.choices
    : ["Russian", "Bulgarian", "Serbian", "Ukrainian"];
  const options = choiceLabels.map((label, index) => ({
    id: index + 1,
    label,
  }));
  // スコア取得（複数のキー形式に対応）
  const resolvedYourName = username || profile.username || "YOU";
  const youCorrect = scores[resolvedYourName] ?? scores[username] ?? 0;
  const opponentCorrect = scores[opponent] ?? 0;
  const progressPercent = running ? progress : 0;
  const originText = lastResult || "Origin: Northern Hemisphere";
  const audioStatusLabel = (() => {
    if (!isAudioMode) return undefined;
    if (audioStatus === "needsClick") return "Click to play audio";
    if (audioStatus === "playing") return "Wait for audio to finish";
    if (audioStatus === "waiting") return "Make your choice now";
    return "Wait for audio to finish";
  })();

  let screenContent: React.ReactNode;

  if (countdown !== null) {
    screenContent = (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background-dark font-display text-slate-100">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">
            Opponent Found
          </p>
          <h2 className="text-2xl font-bold text-white">
            vs <span className="text-primary">{opponent || "???"}</span>
          </h2>
        </div>
        <div className="flex items-center justify-center gap-12">
          <div className="flex flex-col items-center gap-3">
            <div
              className="size-20 rounded-full border-4 border-primary bg-cover bg-center shadow-[0_0_20px_rgba(19,127,236,0.4)]"
              style={{
                backgroundImage: `url("${profile.imageUrl || DEFAULT_AVATAR}")`,
              }}
            />
            <span className="text-sm font-bold">{username || "YOU"}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-7xl font-black text-primary animate-pulse">
              {countdown}
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div
              className="size-20 rounded-full border-4 border-red-500 bg-cover bg-center shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              style={{
                backgroundImage: `url("${opponentAvatar || DEFAULT_AVATAR}")`,
              }}
            />
            <span className="text-sm font-bold">{opponent || "???"}</span>
          </div>
        </div>
        <p className="mt-10 text-xs uppercase tracking-widest text-slate-500">
          Get Ready
        </p>
      </div>
    );
  } else if (isWaiting) {
    screenContent = (
      <MatchWaitingScreen
        title={waitingTitle}
        minutes={waitingMinutes}
        seconds={waitingSecs}
        onCancel={() => navigate("/home")}
      />
    );
  } else {
    screenContent = (
      <MatchBattleScreen
        modeLabel={battleLabels.modeLabel}
        difficultyLabel={battleLabels.difficultyLabel}
        progressPercent={progressPercent}
        challengeTitle={battleLabels.challengeTitle}
        mediaType={battleLabels.mediaType}
        prompt={question?.prompt ?? "準備中..."}
        origin={originText}
        audioCaption="Click to replay audio clue"
        audioStatusLabel={audioStatusLabel}
        audioDisabled={isAudioMode && audioStatus !== "needsClick" && audioStatus !== "waiting"}
        optionsDisabled={
          answerLocked || (isAudioMode && (audioStatus !== "waiting" || !!roundFeedback))
        }
        options={options}
        feedback={roundFeedback}
        you={{
          role: username || "YOU",
          correctCount: String(youCorrect),
          streak: "0",
          accent: "primary",
          avatarUrl: profile.imageUrl || DEFAULT_AVATAR,
          streakIcon: "local_fire_department",
        }}
        opponent={{
          role: opponent || "OPPONENT",
          correctCount: String(opponentCorrect),
          streak: "0",
          accent: "danger",
          avatarUrl: opponentAvatar || DEFAULT_AVATAR,
          streakIcon: "bolt",
        }}
        onQuit={() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
          }
          navigate("/home");
        }}
        onSelectOption={(option) => handleAnswer(option.label)}
        onReplayAudio={
          isAudioMode
            ? () => {
                if (!question?.audioUrl) return;
                const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
                const resolvedUrl = question.audioUrl.startsWith("http")
                  ? question.audioUrl
                  : `${baseUrl && baseUrl.length > 0 ? baseUrl : "http://localhost:8000"}${question.audioUrl}`;
                playAudio(resolvedUrl);
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      {screenContent}
      {isAudioMode ? (
        <audio
          ref={audioRef}
          preload="auto"
          onEnded={() => {
            setAudioStatus("waiting");
            setTimerRunning(true);
          }}
        />
      ) : null}
    </>
  );
};

export default OnlineTextMatch;
