import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import HomeScreen from "@/components/HomeScreen";
import GameScreen from "@/components/GameScreen";

export default function Index() {
  const game = useGameState();
  const [playing, setPlaying] = useState(false);

  if (!game.loaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <span className="text-2xl animate-pulse">💕</span>
      </div>
    );
  }

  if (!playing) {
    return (
      <HomeScreen
        totalAnswered={game.totalAnswered}
        totalQuestions={game.totalQuestions}
        isaacAnswered={game.isaacAnswered}
        ellaAnswered={game.ellaAnswered}
        bibleAnswered={game.bibleAnswered}
        isComplete={game.isComplete}
        onStart={() => setPlaying(true)}
        onReset={game.resetGame}
      />
    );
  }

  return (
    <GameScreen
      currentQuestion={game.currentQuestion}
      totalAnswered={game.totalAnswered}
      totalQuestions={game.totalQuestions}
      onAnswered={game.markAnswered}
      onHome={() => setPlaying(false)}
      isComplete={game.isComplete}
    />
  );
}
