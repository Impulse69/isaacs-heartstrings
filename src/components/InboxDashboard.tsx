import React, { useEffect, useState } from "react";
import { GameQuestion } from "@/hooks/useGameState";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface EllaAsk {
  id: string;
  question_text: string;
  answer_text: string | null;
  created_at: string;
}

export const InboxDashboard: React.FC<InboxDashboardProps> = ({ allQuestions, onClose }) => {
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [asks, setAsks] = useState<EllaAsk[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"answers" | "questions">("questions");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [answersRes, asksRes] = await Promise.all([
          supabase.from("ella_answers").select("*").order("created_at", { ascending: false }),
          supabase.from("ella_asks").select("*").order("created_at", { ascending: false })
        ]);

        if (answersRes.data) {
          const uniqueAnswers: Record<number, AnswerRecord> = {};
          answersRes.data.forEach((ans) => {
            if (!uniqueAnswers[ans.question_id]) {
              uniqueAnswers[ans.question_id] = ans;
            }
          });
          setAnswers(Object.values(uniqueAnswers).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ));
        }

        if (asksRes.data) {
          setAsks(asksRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReply = async (askId: string) => {
    const text = replyText[askId];
    if (!text?.trim()) return;

    setSubmittingReply(prev => ({ ...prev, [askId]: true }));
    try {
      await supabase
        .from("ella_asks")
        .update({ answer_text: text })
        .eq("id", askId);

      setAsks(prev =>
        prev.map(ask => ask.id === askId ? { ...ask, answer_text: text } : ask)
      );
    } catch (err) {
      console.error("Failed to reply", err);
    } finally {
      setSubmittingReply(prev => ({ ...prev, [askId]: false }));
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-xl font-bold text-rose-600 flex items-center gap-2">
          <span>💌</span> Inbox
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
          Close
        </Button>
      </div>

      <div className="flex border-b bg-white/50 backdrop-blur-sm sticky top-[62px] z-10">
        <button
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "questions" ? "text-rose-600 border-b-2 border-rose-600" : "text-muted-foreground hover:text-rose-500"}`}
          onClick={() => setActiveTab("questions")}
        >
          Questions from Ella ({asks.filter(a => !a.answer_text).length} New)
        </button>
        <button
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "answers" ? "text-rose-600 border-b-2 border-rose-600" : "text-muted-foreground hover:text-rose-500"}`}
          onClick={() => setActiveTab("answers")}
        >
          Ella's Answers
        </button>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-3xl animate-pulse">💕</span>
          </div>
        ) : activeTab === "questions" ? (
          // QUESTIONS TAB
          asks.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 text-center gap-4 text-muted-foreground">
              <span className="text-5xl opacity-50">📭</span>
              <p>No questions from Ella yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-20">
                {asks.map((ask, idx) => (
                  <motion.div 
                    key={ask.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                    <p className="text-sm font-semibold text-rose-500 mb-2 leading-tight">
                      Ella asked:
                    </p>
                    <p className="text-lg text-gray-900 font-semibold relative z-10 pl-2 border-l-2 border-rose-200 py-1 mb-4">
                      "{ask.question_text}"
                    </p>

                    {ask.answer_text ? (
                      <div className="bg-rose-50 p-3 rounded-xl mt-3">
                        <p className="text-xs text-rose-500 font-semibold mb-1 uppercase tracking-wider">Your Answer:</p>
                        <p className="text-sm text-gray-900">{ask.answer_text}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        <Textarea
                          placeholder="Type your answer here..."
                          className="w-full text-sm resize-none focus:ring-rose-300 text-gray-900 placeholder:text-gray-500 bg-white border-gray-300"
                          rows={2}
                          value={replyText[ask.id] || ""}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [ask.id]: e.target.value }))}
                        />
                        <Button 
                          size="sm" 
                          className="w-full bg-rose-500 hover:bg-rose-600 font-bold"
                          disabled={!replyText[ask.id]?.trim() || submittingReply[ask.id]}
                          onClick={() => handleReply(ask.id)}
                        >
                          {submittingReply[ask.id] ? "Sending..." : "Send Reply 💌"}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )
        ) : (
          // ANSWERS TAB
          answers.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 text-center gap-4 text-muted-foreground">
              <span className="text-5xl opacity-50">📭</span>
              <p>No messages yet. Ella hasn't answered any questions about you.</p>
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
                      <p className="text-lg text-gray-900 font-semibold relative z-10 pl-2 border-l-2 border-rose-200 py-1">
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
          )
        )}
      </div>
    </div>
  );
};
