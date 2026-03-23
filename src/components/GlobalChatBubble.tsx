import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X } from "lucide-react";

interface EllaAsk {
  id: string;
  question_text: string;
  answer_text: string | null;
  is_read: boolean;
  created_at: string;
}

export const GlobalChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [asks, setAsks] = useState<EllaAsk[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAsks();

    // Subscribe to new answers
    const channel = supabase
      .channel('public:ella_asks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ella_asks' },
        (payload) => {
          fetchAsks(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAsks = async () => {
    const { data, error } = await supabase
      .from("ella_asks")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setAsks(data);
      const unread = data.filter(a => a.answer_text && !a.is_read).length;
      setUnreadCount(unread);
    }
  };

  const markAsRead = async (id: string) => {
    setAsks(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase.from("ella_asks").update({ is_read: true }).eq("id", id);
  };

  useEffect(() => {
    if (isOpen) {
      // Mark all answered as read when opened
      const unreadAsks = asks.filter(a => a.answer_text && !a.is_read);
      unreadAsks.forEach(a => markAsRead(a.id));
    }
  }, [isOpen, asks]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-rose-500 hover:bg-rose-600 shadow-xl border-4 border-white transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white/95 backdrop-blur shadow-2xl rounded-3xl border border-rose-100 overflow-hidden z-50 flex flex-col"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            <div className="bg-rose-500 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <span>💌</span> Isaac's Answers
              </h3>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-rose-600 rounded-full" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4 max-h-[400px]">
              {asks.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  <span className="text-4xl block mb-2 opacity-50">💭</span>
                  <p>You haven't asked any questions yet!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {asks.map((ask) => (
                    <div key={ask.id} className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                      <p className="text-sm font-semibold text-rose-700 mb-2">Q: {ask.question_text}</p>
                      {ask.answer_text ? (
                        <div className="bg-white p-3 rounded-xl shadow-sm inline-block">
                          <p className="text-slate-800">A: {ask.answer_text}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-400 italic">Waiting for Isaac's reply...</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
