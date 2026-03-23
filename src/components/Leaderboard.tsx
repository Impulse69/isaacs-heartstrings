import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface LeaderboardProps {
  onClose: () => void;
}

interface GameRecord {
  id: string;
  player_role: "isaac" | "ella";
  round_index: number;
  completion_time: number;
  created_at: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
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
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
          <span>🏆</span> Speed Run Records
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
          Close
        </Button>
      </div>

      <div className="flex-1 p-6">
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
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 pb-20">
              {rounds.map((round, idx) => {
                const isaacTime = records[round].isaac;
                const ellaTime = records[round].ella;

                return (
                  <motion.div 
                    key={round}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center bg-muted/50 -mx-4 -mt-4 p-3 rounded-t-xl border-b mb-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Round {round + 1}
                      </span>
                      <span className="text-xl">⚔️</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Isaac Card */}
                      <div className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${
                        isaacTime !== undefined && (ellaTime === undefined || isaacTime < ellaTime) 
                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 ring-2 ring-rose-300 dark:ring-rose-800 ring-offset-2 dark:ring-offset-background" 
                        : "bg-muted/30 border-muted opacity-80"
                      }`}>
                        <div className="text-sm font-semibold text-rose-500 mb-1">Isaac</div>
                        {isaacTime ? (
                          <div className="text-2xl font-black text-foreground">{isaacTime.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">sec</span></div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic h-8 flex items-center">Pending...</div>
                        )}
                      </div>

                      {/* Ella Card */}
                      <div className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${
                        ellaTime !== undefined && (isaacTime === undefined || ellaTime < isaacTime) 
                        ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900 ring-2 ring-pink-300 dark:ring-pink-800 ring-offset-2 dark:ring-offset-background" 
                        : "bg-muted/30 border-muted opacity-80"
                      }`}>
                        <div className="text-sm font-semibold text-pink-500 mb-1">Ella</div>
                        {ellaTime ? (
                          <div className="text-2xl font-black text-foreground">{ellaTime.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">sec</span></div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic h-8 flex items-center">Pending...</div>
                        )}
                      </div>
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
