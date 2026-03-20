import { useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { GameQuestion } from "@/hooks/useGameState";
import PuzzleBoard from "@/components/PuzzleBoard";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface GameScreenProps {
  currentQuestion: GameQuestion | null;
  totalAnswered: number;
  totalQuestions: number;
  onAnswered: () => void;
  onHome: () => void;
  isComplete: boolean;
}

export default function GameScreen({
  currentQuestion,
  totalAnswered,
  totalQuestions,
  onAnswered,
  onHome,
  isComplete,
}: GameScreenProps) {
  const [phase, setPhase] = useState<"puzzle" | "question">("puzzle");
  const [puzzleKey, setPuzzleKey] = useState(0);

  const handlePuzzleSolved = useCallback(() => {
    // Fire confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d6336c", "#9c36b5", "#f59f00", "#ff6b6b", "#ffd43b"],
    });
    setPhase("question");
  }, []);

  const handleNext = useCallback(() => {
    onAnswered();
    setPhase("puzzle");
    setPuzzleKey((k) => k + 1);
  }, [onAnswered]);

  if (isComplete || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 bg-background gap-4">
        <span className="text-5xl">🏆</span>
        <p className="text-xl font-bold text-foreground text-center">You've completed all 300 questions!</p>
        <Button onClick={onHome} size="lg" className="active:scale-95 transition-transform">
          Back Home
        </Button>
      </div>
    );
  }

  const progress = (totalAnswered / totalQuestions) * 100;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={onHome} className="px-2 active:scale-95">
          ← 
        </Button>
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {totalAnswered}/{totalQuestions}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
        {phase === "puzzle" ? (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Solve the puzzle to unlock your question ✨
            </p>
            <PuzzleBoard
              key={puzzleKey}
              onSolved={handlePuzzleSolved}
              roundNumber={totalAnswered}
            />
          </>
        ) : (
          <QuestionCard question={currentQuestion} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}
