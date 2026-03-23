import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlobalChatBubble } from "@/components/GlobalChatBubble";

import { GameMode, PlayerRole } from "@/hooks/useGameState";
import { PartnerStatusWidget } from "@/components/PartnerStatusWidget";

interface HomeScreenProps {
  totalAnswered: number;
  totalQuestions: number;
  isaacAnswered: number;
  ellaAnswered: number;
  bibleAnswered: number;
  isComplete: boolean;
  onStart: () => void;
  onReset: () => void;
  onSignOut?: () => void;
  gameMode?: GameMode | null;
  playerRole?: PlayerRole | null;
  onOpenInbox?: () => void;
  onOpenLeaderboard?: () => void;
}

export default function HomeScreen({
  totalAnswered,
  totalQuestions,
  isaacAnswered,
  ellaAnswered,
  bibleAnswered,
  isComplete,
  onStart,
  onReset,
  onSignOut,
  gameMode,
  playerRole,
  onOpenInbox,
  onOpenLeaderboard
}: HomeScreenProps) {
  const progress = (totalAnswered / totalQuestions) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-8 bg-background relative overflow-hidden">
      <PartnerStatusWidget playerRole={playerRole} gameMode={gameMode} />
      
      {/* Title area */}
      <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
        <span className="text-5xl">🧩</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance text-center leading-tight tracking-tight">
          Isaac's
          <br />
          <span className="text-primary">Heartstrings</span>
        </h1>
        <p className="text-muted-foreground text-center max-w-xs text-sm leading-relaxed">
          Solve puzzles together. Unlock questions about each other — and test your Bible knowledge too.
        </p>
      </div>

      {/* Progress section */}
      {totalAnswered > 0 && (
        <div className="w-full max-w-xs mb-8 space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
          {playerRole !== "ella" && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{totalAnswered}/{totalQuestions}</span>
            </div>
          )}
          <Progress value={progress} className="h-3" />

          {playerRole === "ella" ? (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 flex flex-col items-center justify-center">
                <span className="text-lg block">💕</span>
                <p className="text-primary font-medium mt-1">About Him</p>
              </div>
              <div className="rounded-lg bg-secondary/50 border border-secondary p-2 flex flex-col items-center justify-center">
                <span className="text-lg block">💜</span>
                <p className="text-secondary-foreground font-medium mt-1">About Me</p>
              </div>
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-2 flex flex-col items-center justify-center">
                <span className="text-lg block">📖</span>
                <p className="text-accent-foreground font-medium mt-1">Our Faith</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                <p className="font-bold text-foreground">{isaacAnswered}/180</p>
                <p className="text-muted-foreground">💕 Isaac</p>
              </div>
              <div className="rounded-lg bg-secondary/50 border border-secondary p-2">
                <p className="font-bold text-foreground">{ellaAnswered}/30</p>
                <p className="text-muted-foreground">💜 Ella</p>
              </div>
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-2">
                <p className="font-bold text-foreground">{bibleAnswered}/90</p>
                <p className="text-muted-foreground">📖 Bible</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs animate-fade-in" style={{ animationDelay: "200ms" }}>
        {isComplete ? (
          <>
            <div className="text-center mb-2">
              <span className="text-3xl">🎉</span>
              <p className="text-lg font-semibold text-foreground mt-1">You answered them all!</p>
              <p className="text-sm text-muted-foreground">What an amazing couple 💕</p>
            </div>
            <Button onClick={onReset} size="lg" className="w-full active:scale-95 transition-transform">
              Play Again 🔄
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onStart}
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform text-base"
            >
              {totalAnswered > 0 ? "Continue Playing 💕" : "Start Playing 💕"}
            </Button>
            
            {gameMode === "apart" && onOpenLeaderboard && (
              <Button
                onClick={onOpenLeaderboard}
                size="lg"
                variant="outline"
                className="w-full border-amber-300 text-amber-600 hover:bg-amber-50 active:scale-95 transition-transform text-base gap-2 shadow-sm"
              >
                🏆 View Leaderboard
              </Button>
            )}

            {gameMode === "apart" && playerRole === "isaac" && onOpenInbox && (
              <Button
                onClick={onOpenInbox}
                size="lg"
                variant="outline"
                className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 active:scale-95 transition-transform text-base gap-2 shadow-sm"
              >
                💌 View Ella's Inbox
              </Button>
            )}

            {totalAnswered > 0 && (
              <Button
                onClick={onReset}
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                Reset Progress
              </Button>
            )}
          </>
        )}
      </div>

      {/* Sign Out / Reset Mode */}
      <div className="mt-8 animate-fade-in flex flex-col items-center gap-1" style={{ animationDelay: "300ms" }}>
        {gameMode && (
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Playing as <span className="text-rose-500">{playerRole || "Guest"}</span>
          </p>
        )}
        <Button
          onClick={onSignOut}
          variant="link"
          size="sm"
          className="text-rose-400 hover:text-rose-500 text-xs gap-1"
        >
          Sign out / Switch Device
        </Button>
      </div>
      {(playerRole === "ella" || (!playerRole && gameMode === "together")) && (
        <GlobalChatBubble />
      )}
    </div>
  );
}
