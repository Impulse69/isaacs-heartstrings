import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GameQuestion } from "@/hooks/useGameState";

interface LeaderboardProps {
  onClose: () => void;
  allQuestions?: GameQuestion[];
  playerRole?: "isaac" | "ella" | null;
}

interface GameRecord {
  id: string;
  player_role: "isaac" | "ella";
  round_index: number;
  completion_time: number;
  created_at: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, allQuestions = [], playerRole }) => {
  const handleClearRecords = async () => {
    if (!window.confirm("Wipe ALL speed run records for both players? This can't be undone.")) return;
    const { error } = await supabase.from("game_records").delete().gte("round_index", -100000);
    if (error) {
      alert("Failed to clear: " + error.message);
    } else {
      setRecords({});
    }
  };

  const [records, setRecords] = useState<Record<number, { isaac?: number; ella?: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data, error } = await supabase
          .from("game_records")
          .select("*")
          .order("created_at", { ascending: false }); // Get latest attempt for every round

        if (error) {
          console.error("Error fetching records:", error);
        } else if (data) {
          // Process records to group by round_index and keep only the FASTEST attempt per player per round
          const processed: Record<number, { isaac?: number; ella?: number }> = {};
          data.forEach((r: GameRecord) => {
            if (!processed[r.round_index]) {
              processed[r.round_index] = {};
            }
            const currentBest = processed[r.round_index][r.player_role];
            if (currentBest === undefined || r.completion_time < currentBest) {
              processed[r.round_index][r.player_role] = r.completion_time;
            }
          });
          setRecords(processed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const rounds = Object.keys(records).map(Number).sort((a, b) => b - a); // Newest rounds first

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b bg-background/80 backdrop-blur-sm shrink-0 shadow-sm">
        <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
          <span>🏆</span> Speed Run Records
        </h2>
        <div className="flex items-center gap-1">
          {playerRole === "isaac" && (
            <Button variant="ghost" size="sm" onClick={handleClearRecords} className="rounded-full text-xs text-muted-foreground hover:text-red-500">
              Clear
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full px-4 py-6 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-4xl animate-spin">⏳</span>
          </div>
        ) : rounds.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center gap-4 text-muted-foreground">
            <span className="text-5xl opacity-50">🏃‍♂️</span>
            <p>No records set yet. Start solving puzzles to see who is faster!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20 w-full">
              {rounds.map((round, idx) => {
                const isaacTime = records[round].isaac;
                const ellaTime = records[round].ella;
                const question = allQuestions.find((q) => q.id === round);
                const winner = isaacTime !== undefined && ellaTime !== undefined
                  ? (isaacTime < ellaTime ? "isaac" : "ella")
                  : null;

                return (
                  <motion.div
                    key={round}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm flex flex-col gap-3 w-full max-w-full overflow-hidden"
                  >
                    <div className="flex justify-between items-center bg-muted/50 -mx-4 -mt-4 p-3 rounded-t-xl border-b mb-1 gap-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Challenge #{idx + 1}
                        </span>
                        {question && (
                          <span className="text-xs text-foreground/80 font-medium truncate mt-0.5">
                            {question.text}
                          </span>
                        )}
                      </div>
                      <span className="text-xl shrink-0">
                        {winner ? "👑" : "⚔️"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Isaac Card */}
                      <div className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all min-h-[84px] ${
                        isaacTime === undefined
                        ? "bg-transparent border-dashed border-muted-foreground/30"
                        : winner === "isaac"
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 ring-2 ring-rose-300 dark:ring-rose-700"
                        : "bg-muted/40 dark:bg-muted/20 border-border"
                      }`}>
                        <div className="text-sm font-semibold text-rose-500 mb-1">Isaac</div>
                        {isaacTime !== undefined ? (
                          <div className="text-2xl font-black text-foreground">{isaacTime.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">sec</span></div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">Pending…</div>
                        )}
                      </div>

                      {/* Ella Card */}
                      <div className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all min-h-[84px] ${
                        ellaTime === undefined
                        ? "bg-transparent border-dashed border-muted-foreground/30"
                        : winner === "ella"
                        ? "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 ring-2 ring-pink-300 dark:ring-pink-700"
                        : "bg-muted/40 dark:bg-muted/20 border-border"
                      }`}>
                        <div className="text-sm font-semibold text-pink-500 mb-1">Ella</div>
                        {ellaTime !== undefined ? (
                          <div className="text-2xl font-black text-foreground">{ellaTime.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">sec</span></div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">Pending…</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
