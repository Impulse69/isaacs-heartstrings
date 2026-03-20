import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { GameQuestion, GameMode, PlayerRole } from "@/hooks/useGameState";
import PuzzleBoard from "@/components/PuzzleBoard";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface GameScreenProps {
  currentQuestion: GameQuestion | null;
  totalAnswered: number;
  totalQuestions: number;
  onAnswered: () => void;
  onHome: () => void;
  isComplete: boolean;
  gameMode: GameMode | null;
  playerRole: PlayerRole | null;
}

export default function GameScreen({
  currentQuestion,
  totalAnswered,
  totalQuestions,
  onAnswered,
  onHome,
  isComplete,
  gameMode,
  playerRole
}: GameScreenProps) {
  const [phase, setPhase] = useState<"puzzle" | "question">("puzzle");
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Reset timer on phase="puzzle"
  useEffect(() => {
    if (phase === "puzzle") {
      setStartTime(Date.now());
      setElapsed(0);
    }
  }, [phase, puzzleKey]);

  // Live ticking
  useEffect(() => {
    let animationFrameId: number;
    const updateTimer = () => {
      // Only tick while in puzzle phase
      if (phase === "puzzle") {
        setElapsed((Date.now() - startTime) / 1000);
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };
    if (gameMode === "apart" && phase === "puzzle") {
      animationFrameId = requestAnimationFrame(updateTimer);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [startTime, gameMode, phase]);

  const handlePuzzleSolved = useCallback(() => {
    // Record final exact time
    setElapsed((Date.now() - startTime) / 1000);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d6336c", "#9c36b5", "#f59f00", "#ff6b6b", "#ffd43b"],
    });
    setPhase("question");
  }, [startTime]);

  const handleNext = useCallback(async () => {
    // Save completion time to Supabase if in Distance mode
    if (gameMode === "apart" && playerRole) {
      try {
        await supabase.from("game_records").insert([{
          player_role: playerRole,
          round_index: totalAnswered,
          completion_time: elapsed
        }]);
      } catch (err) {
        console.error("Failed to save speed run record", err);
      }
    }

    onAnswered();
    setPhase("puzzle");
    setPuzzleKey((k) => k + 1);
  }, [onAnswered, gameMode, playerRole, elapsed, totalAnswered]);

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
        
        {gameMode === "apart" && (
          <span className="text-xs font-mono font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 shadow-sm whitespace-nowrap">
            ⏱ {elapsed.toFixed(1)}s
          </span>
        )}

        {playerRole !== "ella" && (
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap hidden sm:inline-block">
            {totalAnswered}/{totalQuestions}
          </span>
        )}
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
          <QuestionCard 
            question={currentQuestion} 
            onNext={handleNext} 
            gameMode={gameMode}
            playerRole={playerRole}
          />
        )}
      </div>
    </div>
  );
}
