import { useState, useEffect, useCallback } from "react";
import { isaacQuestions } from "@/data/isaacQuestions";
import { ellaQuestions } from "@/data/ellaQuestions";
import { bibleQuestions, BibleQuestion } from "@/data/bibleQuestions";

export type QuestionType = "isaac" | "ella" | "bible";
export type GameMode = "together" | "apart";
export type PlayerRole = "isaac" | "ella";

export interface GameQuestion {
  id: number;
  type: QuestionType;
  text: string;
  answer?: string; // only for bible
}

const STORAGE_KEY = "puzzle-quest-state";

function buildQuestionPool(): GameQuestion[] {
  const pool: GameQuestion[] = [];
  let id = 0;

  isaacQuestions.forEach((q) => {
    pool.push({ id: id++, type: "isaac", text: q });
  });

  ellaQuestions.forEach((q) => {
    pool.push({ id: id++, type: "ella", text: q });
  });

  bibleQuestions.forEach((q: BibleQuestion) => {
    pool.push({ id: id++, type: "bible", text: q.clue, answer: q.answer });
  });

  return pool;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SavedState {
  answeredIds: number[];
  order: number[];
  gameMode: GameMode | null;
  playerRole: PlayerRole | null;
  pin: string | null;
}

export function useGameState() {
  const allQuestions = buildQuestionPool();

  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRole | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedState = JSON.parse(raw);
        setAnsweredIds(saved.answeredIds || []);
        setOrder(saved.order && saved.order.length === allQuestions.length ? saved.order : shuffle(allQuestions.map((_, i) => i)));
        setCurrentIndex(saved.answeredIds?.length || 0);
        setGameMode(saved.gameMode || null);
        setPlayerRole(saved.playerRole || null);
        setPin(saved.pin || null);
      } else {
        const newOrder = shuffle(allQuestions.map((_, i) => i));
        setOrder(newOrder);
      }
    } catch {
      const newOrder = shuffle(allQuestions.map((_, i) => i));
      setOrder(newOrder);
    }
    setLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      answeredIds, 
      order, 
      gameMode, 
      playerRole, 
      pin 
    }));
  }, [answeredIds, order, loaded, gameMode, playerRole, pin]);

  const currentQuestion: GameQuestion | null =
    order.length > 0 && currentIndex < order.length
      ? allQuestions[order[currentIndex]]
      : null;

  const markAnswered = useCallback(() => {
    if (!currentQuestion) return;
    setAnsweredIds((prev) => [...prev, currentQuestion.id]);
    setCurrentIndex((prev) => prev + 1);
  }, [currentQuestion]);

  const resetGame = useCallback(() => {
    const newOrder = shuffle(allQuestions.map((_, i) => i));
    setOrder(newOrder);
    setAnsweredIds([]);
    setCurrentIndex(0);
  }, [allQuestions]);

  const signOut = useCallback(() => {
    setGameMode(null);
    setPlayerRole(null);
    setPin(null);
    // Let the useEffect save the updated state (which handles removing identity but keeping progress)
    // Actually, if we just set state, the useEffect will persist the nulls.
  }, []);

  const selectMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
  }, []);

  const verifyIdentity = useCallback((role: PlayerRole, passcode: string) => {
    setPlayerRole(role);
    setPin(passcode);
  }, []);

  const totalAnswered = answeredIds.length;
  const isaacAnswered = answeredIds.filter((id) => allQuestions[id]?.type === "isaac").length;
  const ellaAnswered = answeredIds.filter((id) => allQuestions[id]?.type === "ella").length;
  const bibleAnswered = answeredIds.filter((id) => allQuestions[id]?.type === "bible").length;

  const isComplete = totalAnswered >= allQuestions.length;

  return {
    currentQuestion,
    markAnswered,
    resetGame,
    signOut,
    selectMode,
    verifyIdentity,
    totalAnswered,
    isaacAnswered,
    ellaAnswered,
    bibleAnswered,
    totalQuestions: allQuestions.length,
    isComplete,
    loaded,
    gameMode,
    playerRole,
    allQuestions,
  };
}
