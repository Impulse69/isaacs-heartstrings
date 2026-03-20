import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface HomeScreenProps {
  totalAnswered: number;
  totalQuestions: number;
  isaacAnswered: number;
  ellaAnswered: number;
  bibleAnswered: number;
  isComplete: boolean;
  onStart: () => void;
  onReset: () => void;
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
}: HomeScreenProps) {
  const progress = (totalAnswered / totalQuestions) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 py-12 bg-background">
      {/* Title area */}
      <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
        <span className="text-5xl">🧩</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance text-center leading-tight tracking-tight">
          Isaac & Ella's
          <br />
          <span className="text-primary">Puzzle Quest</span>
        </h1>
        <p className="text-muted-foreground text-center max-w-xs text-sm leading-relaxed">
          Solve puzzles together. Unlock questions about each other — and test your Bible knowledge too.
        </p>
      </div>

      {/* Progress section */}
      {totalAnswered > 0 && (
        <div className="w-full max-w-xs mb-8 space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{totalAnswered}/{totalQuestions}</span>
          </div>
          <Progress value={progress} className="h-3" />

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
    </div>
  );
}
