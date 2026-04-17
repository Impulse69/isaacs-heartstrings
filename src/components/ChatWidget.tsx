import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, X, Smile, Image as ImageIcon, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { GameMode, PlayerRole } from "@/hooks/useGameState";

interface ChatMessage {
  id: string;
  sender_role: "isaac" | "ella";
  message: string;
  created_at: string;
}

interface ParsedContent {
  kind: "text" | "image";
  text?: string;
  url?: string;
  caption?: string;
}

const EMOJI_SET = [
  "❤️","💕","💖","💘","💝","💗","💓","💞","😍","🥰",
  "😘","😗","😙","😚","🤗","😊","😂","🤣","😅","😇",
  "🙈","🙊","😏","😌","😴","🤩","🥳","😎","🤤","😋",
  "😭","🥺","😢","😔","😤","😳","🤭","😬","🙃","😉",
  "👋","🙌","👏","🤝","🙏","👍","💪","✨","🔥","⭐",
  "🌹","🌸","🌺","🌻","🌷","💐","🍫","🍰","🍷","☕",
  "🎉","🎊","🎁","💌","💍","💑","👫","🫶","💤","🌙",
];

const TYPING_CHANNEL = "chat-typing";
const TYPING_TIMEOUT = 3000;

function parseMessage(raw: string): ParsedContent {
  if (raw.startsWith("{") && raw.includes("\"type\"")) {
    try {
      const obj = JSON.parse(raw);
      if (obj.type === "image" && obj.url) {
        return { kind: "image", url: obj.url, caption: obj.caption };
      }
    } catch {
      // fall through
    }
  }
  return { kind: "text", text: raw };
}

async function compressImage(file: File, maxDim = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDay(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

interface ChatWidgetProps {
  gameMode: GameMode | null;
  playerRole: PlayerRole | null;
}

export default function ChatWidget({ gameMode, playerRole }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [kbOffset, setKbOffset] = useState(0);
  const lastReadKey = `chat-last-read-${playerRole ?? "guest"}`;
  const [lastReadAt, setLastReadAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const stored = window.localStorage.getItem(lastReadKey);
    return stored ? Number(stored) : 0;
  });
  const unread = useMemo(
    () => messages.filter((m) => m.sender_role !== playerRole && new Date(m.created_at).getTime() > lastReadAt).length,
    [messages, lastReadAt, playerRole]
  );

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);
  const partnerTypingTimerRef = useRef<number | null>(null);

  const isChatVisible = gameMode === "apart" && !!playerRole;
  const partnerRole: "isaac" | "ella" | null = playerRole === "isaac" ? "ella" : playerRole === "ella" ? "isaac" : null;
  const partnerLabel = partnerRole === "ella" ? "Ella" : "Isaac";
  const partnerEmoji = partnerRole === "ella" ? "💕" : "💙";

  // Fetch + subscribe to messages whenever chat is mounted (so unread counts work even when closed)
  useEffect(() => {
    if (!isChatVisible) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (!error && data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase
      .channel("public:chat_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isChatVisible, playerRole]);

  // Keep a ref to isOpen for use in realtime callback
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      const now = Date.now();
      setLastReadAt(now);
      try { window.localStorage.setItem(lastReadKey, String(now)); } catch { /* ignore */ }
    }
  }, [isOpen, lastReadKey]);

  // Typing indicator channel
  useEffect(() => {
    if (!isChatVisible || !isOpen || !playerRole) return;

    const channel = supabase.channel(TYPING_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const from = (payload.payload as { sender: string } | undefined)?.sender;
        if (from && from !== playerRole) {
          setPartnerTyping(true);
          if (partnerTypingTimerRef.current) window.clearTimeout(partnerTypingTimerRef.current);
          partnerTypingTimerRef.current = window.setTimeout(() => setPartnerTyping(false), TYPING_TIMEOUT);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      if (partnerTypingTimerRef.current) window.clearTimeout(partnerTypingTimerRef.current);
    };
  }, [isChatVisible, isOpen, playerRole]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  // Keyboard-aware bottom offset via VisualViewport
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(offset);
    };
    handler();
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, [isOpen]);

  const sendTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: playerRole },
    });
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !playerRole) return;
    setNewMessage("");
    setShowEmoji(false);
    const { error } = await supabase.from("chat_messages").insert([
      { sender_role: playerRole, message: text },
    ]);
    if (error) console.error(error);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setNewMessage((m) => m + emoji);
    inputRef.current?.focus();
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !playerRole) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      const payload = JSON.stringify({ type: "image", url: dataUrl });
      const { error } = await supabase.from("chat_messages").insert([
        { sender_role: playerRole, message: payload },
      ]);
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Group messages with day separators
  const grouped = useMemo(() => {
    const out: Array<{ type: "day"; key: string; label: string } | { type: "msg"; msg: ChatMessage }> = [];
    let lastDay = "";
    for (const msg of messages) {
      const d = new Date(msg.created_at);
      const day = formatDay(d);
      if (day !== lastDay) {
        out.push({ type: "day", key: `day-${msg.id}`, label: day });
        lastDay = day;
      }
      out.push({ type: "msg", msg });
    }
    return out;
  }, [messages]);

  if (!isChatVisible) return null;

  const accentColor = playerRole === "isaac" ? "from-blue-500 to-indigo-600" : "from-rose-500 to-pink-600";

  return (
    <>
      {/* Floating button (hidden while open) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br ${accentColor} text-white flex items-center justify-center`}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </motion.button>
      )}

      {/* Chat overlay — full screen on mobile, floating card on desktop */}
      {isOpen && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex sm:items-center sm:justify-end"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="flex flex-col w-full h-[100dvh] sm:h-[85vh] sm:max-h-[720px] sm:w-[420px] sm:mr-6 sm:rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
              style={{ paddingBottom: kbOffset ? `${kbOffset}px` : undefined }}
            >
              {/* Header */}
              <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${accentColor} text-white shrink-0`}>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                  {partnerEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold leading-tight">{partnerLabel}</div>
                  <div className="text-xs text-white/80 leading-tight">
                    {partnerTyping ? "typing…" : "online"}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 py-4 bg-gradient-to-b from-rose-50/40 to-white dark:from-zinc-900 dark:to-zinc-900">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-gray-500 dark:text-gray-400 px-6">
                    <Heart className="h-10 w-10 text-rose-400" />
                    <p className="text-sm">Say hi to {partnerLabel} — start the conversation 💌</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {grouped.map((item) => {
                      if (item.type === "day") {
                        return (
                          <div key={item.key} className="flex justify-center my-3">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-200/60 dark:bg-zinc-800 dark:text-gray-400 px-3 py-1 rounded-full">
                              {item.label}
                            </span>
                          </div>
                        );
                      }
                      const msg = item.msg;
                      const mine = msg.sender_role === playerRole;
                      const content = parseMessage(msg.message);
                      return (
                        <motion.div
                          key={msg.id}
                          layout
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.18 }}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[78%]`}>
                            {content.kind === "image" ? (
                              <button
                                onClick={() => content.url && setViewingImage(content.url)}
                                className={`rounded-2xl overflow-hidden border shadow-sm ${mine ? "border-rose-200" : "border-gray-200 dark:border-zinc-700"}`}
                              >
                                <img src={content.url} alt="shared" className="block max-h-64 w-auto" />
                              </button>
                            ) : (
                              <div
                                className={`px-4 py-2 text-sm leading-snug whitespace-pre-wrap break-words rounded-2xl shadow-sm ${
                                  mine
                                    ? `bg-gradient-to-br ${accentColor} text-white rounded-br-sm`
                                    : "bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-zinc-700"
                                }`}
                              >
                                {content.text}
                              </div>
                            )}
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 px-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {partnerTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="px-4 py-2 rounded-2xl rounded-bl-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                      </div>
                    </motion.div>
                  )}

                  <div ref={scrollEndRef} />
                </div>
              </div>

              {/* Emoji tray */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t bg-white dark:bg-zinc-900 dark:border-zinc-700"
                  >
                    <div className="grid grid-cols-10 gap-1 p-2 max-h-40 overflow-y-auto">
                      {EMOJI_SET.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => handleInsertEmoji(e)}
                          className="h-8 w-8 text-xl rounded hover:bg-gray-100 dark:hover:bg-zinc-800 active:scale-90 transition"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Composer */}
              <div className="shrink-0 border-t bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-2" style={{ paddingBottom: `max(0.5rem, env(safe-area-inset-bottom))` }}>
                <div className="flex items-end gap-1">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((s) => !s)}
                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:scale-90 transition ${showEmoji ? "text-rose-500" : "text-gray-500 dark:text-gray-400"}`}
                    aria-label="Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:scale-90 transition text-gray-500 dark:text-gray-400 disabled:opacity-50"
                    aria-label="Send photo"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilePicked}
                  />

                  <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl px-3 py-1.5 flex items-end">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={newMessage}
                      placeholder={uploading ? "Sending photo…" : "Type a message…"}
                      disabled={uploading}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        sendTyping();
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 max-h-[120px] py-1"
                    />
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || uploading}
                    className={`h-10 w-10 rounded-full bg-gradient-to-br ${accentColor} text-white shadow-md disabled:opacity-40`}
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}

      {/* Image lightbox */}
      {viewingImage && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setViewingImage(null)}
          >
            <img src={viewingImage} alt="preview" className="max-h-full max-w-full object-contain" />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close preview"
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>,
          document.body
        )}
    </>
  );
}
