import { useState, useEffect, useCallback } from "react";
import { isaacQuestions } from "@/data/isaacQuestions";
import { ellaQuestions } from "@/data/ellaQuestions";
import { bibleQuestions, BibleQuestion } from "@/data/bibleQuestions";

export type QuestionType = "isaac" | "ella" | "bible";

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
}

export function useGameState() {
  const allQuestions = buildQuestionPool();

  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answeredIds, order }));
  }, [answeredIds, order, loaded]);

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
    localStorage.removeItem(STORAGE_KEY);
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
    totalAnswered,
    isaacAnswered,
    ellaAnswered,
    bibleAnswered,
    totalQuestions: allQuestions.length,
    isComplete,
    loaded,
  };
}
