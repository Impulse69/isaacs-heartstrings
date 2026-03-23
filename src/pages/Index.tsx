import { useState, useEffect } from "react";
import { useGameState } from "@/hooks/useGameState";
import HomeScreen from "@/components/HomeScreen";
import GameScreen from "@/components/GameScreen";
import { GameModeSelection } from "@/components/GameModeSelection";
import { PlayerIdentity } from "@/components/PlayerIdentity";
import { InboxDashboard } from "@/components/InboxDashboard";
import { Leaderboard } from "@/components/Leaderboard";
import ChatWidget from "@/components/ChatWidget";
import { usePlayerPresence } from "@/hooks/usePlayerPresence";

export default function Index() {
  const game = useGameState();
  const [playing, setPlaying] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Toggle Dark Mode for Isaac
  useEffect(() => {
    if (game.playerRole === "isaac") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [game.playerRole]);

  if (!game.loaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <span className="text-2xl animate-pulse">💕</span>
      </div>
    );
  }

  const renderContent = () => {
    // 1. Choose Together vs Apart
    if (!game.gameMode) {
      return <GameModeSelection onSelect={game.selectMode} />;
    }

    // 2. If Apart, verify identity
    if (game.gameMode === "apart" && !game.playerRole) {
      return <PlayerIdentity onVerify={game.verifyIdentity} />;
    }

    // + Inbox View for Isaac
    if (showInbox && game.gameMode === "apart" && game.playerRole === "isaac") {
      return <InboxDashboard allQuestions={game.allQuestions} onClose={() => setShowInbox(false)} />;
    }

    // + Leaderboard View
    if (showLeaderboard && game.gameMode === "apart") {
      return <Leaderboard onClose={() => setShowLeaderboard(false)} />;
    }

    // 3. Normal Game Flow
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
          onSignOut={game.signOut}
          gameMode={game.gameMode}
          playerRole={game.playerRole}
          onOpenInbox={() => setShowInbox(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
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
        gameMode={game.gameMode}
        playerRole={game.playerRole}
      />
    );
  };

  return (
    <>
      {renderContent()}
      <ChatWidget gameMode={game.gameMode} playerRole={game.playerRole} />
    </>
  );
}
