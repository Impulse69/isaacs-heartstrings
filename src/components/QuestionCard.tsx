import { useState, useEffect } from "react";
import { GameQuestion, QuestionType, GameMode, PlayerRole } from "@/hooks/useGameState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface QuestionCardProps {
  question: GameQuestion;
  onNext: () => void;
  gameMode?: GameMode | null;
  playerRole?: PlayerRole | null;
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

export default function QuestionCard({ question, onNext, gameMode, playerRole }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [ellaText, setEllaText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedAnswer, setFetchedAnswer] = useState<string | null>(null);
  
  const config = TYPE_CONFIG[question.type];
  const isDistance = gameMode === "apart";
  
  // Special condition: Question is about Isaac. In Distance Mode, Ella types, Isaac waits.
  const isAsymmetrical = isDistance && question.type === "isaac";
  
  const submitEllaAnswer = async () => {
    if (!ellaText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await supabase.from("ella_answers").insert([{
        question_id: question.id,
        answer_text: ellaText
      }]);
      onNext();
    } catch (err) {
      console.error("Failed to submit answer", err);
      setIsSubmitting(false); // allow retry
    }
  };

  useEffect(() => {
    // If Isaac is viewing an asymmetrical question, establish a subscription
    if (isAsymmetrical && playerRole === "isaac") {
      const channel = supabase
        .channel(`qa_${question.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ella_answers', filter: `question_id=eq.${question.id}` },
          (payload) => {
            setFetchedAnswer((payload.new as any).answer_text);
          }
        )
        .subscribe();
      
      // Also check if she already answered slightly before we mounted
      const checkExisting = async () => {
        const { data, error } = await supabase
          .from("ella_answers")
          .select("answer_text")
          .eq("question_id", question.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          setFetchedAnswer(data.answer_text);
        }
      };
      checkExisting();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAsymmetrical, playerRole, question.id]);

  return (
    <div
      className={`
        w-full max-w-sm mx-auto rounded-2xl border-2 ${config.borderClass} ${config.bgClass}
        p-6 sm:p-8 flex flex-col items-center gap-5 animate-scale-in
        shadow-lg shadow-primary/5
      `}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="text-xl">{config.emoji}</span>
        <span>{config.label}</span>
      </div>

      <p className="text-lg sm:text-xl font-semibold text-center text-foreground leading-relaxed text-balance">
        {question.type === "bible" ? `"${question.text}"` : question.text}
      </p>

      {/* Bible Answer handling */}
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

      {/* Asymmetrical Distance Mode handling for Ella's response */}
      {isAsymmetrical && playerRole === "ella" && (
        <div className="w-full space-y-4 animate-fade-in mt-4 border-t border-primary/20 pt-4">
          <Textarea 
            placeholder="Type your deepest thoughts here..."
            className="min-h-[120px] resize-none bg-white p-4 rounded-xl border-primary/30 focus:ring-primary focus:border-primary shadow-inner"
            value={ellaText}
            onChange={(e) => setEllaText(e.target.value)}
          />
          <Button 
            onClick={submitEllaAnswer}
            disabled={!ellaText.trim() || isSubmitting}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg text-white font-bold"
            size="lg"
          >
            {isSubmitting ? "Sending to Isaac..." : "Send to Isaac! 💕"}
          </Button>
        </div>
      )}

      {isAsymmetrical && playerRole === "isaac" && (
        <div className="w-full space-y-4 animate-fade-in mt-4 text-center border-t border-primary/10 pt-4">
          {fetchedAnswer ? (
            <div className="bg-white/80 p-5 rounded-xl border border-primary/30 shadow-sm animate-fade-in">
              <p className="text-xs text-primary uppercase tracking-wider font-bold mb-3 flex items-center justify-center gap-1">
                <span>✨</span> Ella's Response
              </p>
              <p className="text-lg text-rose-900 italic font-medium">"{fetchedAnswer}"</p>
            </div>
          ) : (
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 animate-pulse">
              <span className="text-3xl mb-2 block animate-bounce">💭</span>
              <p className="text-sm font-semibold text-rose-500">Waiting for Ella's Heartstrings...</p>
            </div>
          )}
        </div>
      )}

      {/* Standard Next button (hidden for Ella during asymmetrical questions because she must submit via the pink button above) */}
      {!(isAsymmetrical && playerRole === "ella") && (
        <Button
          onClick={onNext}
          disabled={isAsymmetrical && playerRole === "isaac" && !fetchedAnswer} // Isaac must wait
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
          size="lg"
        >
          {isAsymmetrical && playerRole === "isaac" && !fetchedAnswer 
            ? "Waiting for Ella..." 
            : "Next Puzzle →"}
        </Button>
      )}
    </div>
  );
}
