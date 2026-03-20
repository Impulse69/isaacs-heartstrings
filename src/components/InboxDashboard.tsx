import React, { useEffect, useState } from "react";
import { GameQuestion } from "@/hooks/useGameState";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface InboxDashboardProps {
  allQuestions: GameQuestion[];
  onClose: () => void;
}

interface AnswerRecord {
  id: string;
  question_id: number;
  answer_text: string;
  created_at: string;
}

export const InboxDashboard: React.FC<InboxDashboardProps> = ({ allQuestions, onClose }) => {
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const { data, error } = await supabase
          .from("ella_answers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching Ella's answers:", error);
        } else if (data) {
          // Keep only the most recent answer per question ID
          const uniqueAnswers: Record<number, AnswerRecord> = {};
          data.forEach((ans) => {
            if (!uniqueAnswers[ans.question_id]) {
              uniqueAnswers[ans.question_id] = ans;
            }
          });
          setAnswers(Object.values(uniqueAnswers).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-xl font-bold text-rose-600 flex items-center gap-2">
          <span>💌</span> Ella's Heartstrings
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
          Close
        </Button>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-3xl animate-pulse">💕</span>
          </div>
        ) : answers.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center gap-4 text-muted-foreground">
            <span className="text-5xl opacity-50">📭</span>
            <p>No messages yet. Ella hasn't answered any questions about you in Distance Mode.</p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 pb-20">
              {answers.map((ans, idx) => {
                const question = allQuestions.find((q) => q.id === ans.question_id);
                if (!question) return null;

                return (
                  <motion.div 
                    key={ans.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                    <p className="text-sm font-semibold text-rose-500 mb-2 leading-tight">
                      {question.text}
                    </p>
                    <p className="text-lg text-foreground italic font-medium relative z-10 pl-2 border-l-2 border-rose-100 py-1">
                      "{ans.answer_text}"
                    </p>
                    <div className="mt-3 text-[10px] text-muted-foreground text-right uppercase tracking-wider font-semibold">
                      {new Date(ans.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};
