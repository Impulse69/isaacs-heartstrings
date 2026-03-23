import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlayerRole } from './useGameState';

export const usePlayerPresence = (playerRole: PlayerRole | null) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playNotificationSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a pleasant synthesized "chime" or "ding"
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide up to A6
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); // quick fade in
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); // smooth fade out

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Could not play notification sound", e);
    }
  };

  useEffect(() => {
    if (playerRole !== "isaac") return;

    // Listen for Ella's login/presence updates
    const channel = supabase
      .channel('public:player_identities')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'player_identities', filter: "role=eq.ella" },
        (payload) => {
          console.log("Ella came online!", payload);
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerRole]);
};
