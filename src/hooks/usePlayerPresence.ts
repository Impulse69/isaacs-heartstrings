import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlayerRole } from './useGameState';

export const usePlayerPresence = (playerRole: PlayerRole | null) => {
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!playerRole) {
      setIsPartnerOnline(false);
      return;
    }

    const partnerRole = playerRole === 'isaac' ? 'ella' : 'isaac';

    // 1. Fetch initial last_active from DB for the partner
    const fetchPartnerProfile = async () => {
      const { data } = await supabase
        .from('player_identities')
        .select('last_active')
        .eq('role', partnerRole)
        .maybeSingle();
      if (data && data.last_active) {
        setPartnerLastSeen(data.last_active);
      }
    };
    fetchPartnerProfile();

    // 2. Subscribe to global presence
    const presenceChannel = supabase.channel('global_presence', {
      config: { presence: { key: playerRole } }
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const isOnline = !!state[partnerRole] && state[partnerRole].length > 0;
      setIsPartnerOnline(isOnline);
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      if (key === partnerRole) {
        setPartnerLastSeen(new Date().toISOString());
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    });

    // 3. Listen to player_identities updates if they log in again
    const dbChannel = supabase
      .channel('public:player_identities_presence')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'player_identities', filter: `role=eq.${partnerRole}` },
        (payload) => {
          if (payload.new && payload.new.last_active) {
            setPartnerLastSeen(payload.new.last_active as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [playerRole]);

  return { isPartnerOnline, partnerLastSeen };
};
