import { useState } from "react";
import { GameQuestion, QuestionType } from "@/hooks/useGameState";
import { Button } from "@/components/ui/button";

interface QuestionCardProps {
  question: GameQuestion;
  onNext: () => void;
}

const TYPE_CONFIG: Record<QuestionType, { label: string; emoji: string; bgClass: string; borderClass: string }> = {
  isaac: {
    label: "Ella, answer this about Isaac",
    emoji: "💕",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/30",
  },
  ella: {
    label: "Isaac, answer this about Ella",
    emoji: "💜",
    bgClass: "bg-secondary/50",
    borderClass: "border-secondary",
  },
  bible: {
    label: "Bible Character Quiz",
    emoji: "📖",
    bgClass: "bg-accent/10",
    borderClass: "border-accent/30",
  },
};

export default function QuestionCard({ question, onNext }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const config = TYPE_CONFIG[question.type];

  return (
    <div
      className={`
        w-full max-w-sm mx-auto rounded-2xl border-2 ${config.borderClass} ${config.bgClass}
        p-6 sm:p-8 flex flex-col items-center gap-5 animate-scale-in
        shadow-lg shadow-primary/5
      `}
    >
      {/* Type badge */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="text-xl">{config.emoji}</span>
        <span>{config.label}</span>
      </div>

      {/* Question text */}
      <p className="text-lg sm:text-xl font-semibold text-center text-foreground leading-relaxed text-balance">
        {question.type === "bible" ? `"${question.text}"` : question.text}
      </p>

      {/* Bible answer reveal */}
      {question.type === "bible" && (
        <div className="w-full">
          {showAnswer ? (
            <div className="text-center animate-fade-in">
              <p className="text-xs text-muted-foreground mb-1">Answer</p>
              <p className="text-2xl font-bold text-accent-foreground bg-accent/20 rounded-lg py-3 px-4">
                {question.answer}
              </p>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-accent/40 text-accent-foreground hover:bg-accent/20"
              onClick={() => setShowAnswer(true)}
            >
              👀 Reveal Answer
            </Button>
          )}
        </div>
      )}

      {/* Next button */}
      <Button
        onClick={onNext}
        className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
        size="lg"
      >
        Next Puzzle →
      </Button>
    </div>
  );
}
