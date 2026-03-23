import { usePlayerPresence } from "@/hooks/usePlayerPresence";
import { GameMode, PlayerRole } from "@/hooks/useGameState";
import { formatDistanceToNow } from "date-fns";

interface PartnerStatusWidgetProps {
  playerRole: PlayerRole | null;
  gameMode: GameMode | null;
}

export function PartnerStatusWidget({ playerRole, gameMode }: PartnerStatusWidgetProps) {
  const { isPartnerOnline, partnerLastSeen } = usePlayerPresence(playerRole);

  if (gameMode !== "apart" || !playerRole) return null;

  const partnerName = playerRole === "isaac" ? "Ella" : "Isaac";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="bg-background/90 backdrop-blur-md border shadow-md rounded-full px-4 py-1.5 flex items-center justify-center gap-2.5 transition-all">
        <span className="relative flex h-2.5 w-2.5">
          {isPartnerOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPartnerOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
        </span>
        <span className="text-xs font-semibold text-foreground whitespace-nowrap">
          {isPartnerOnline 
            ? `${partnerName} is Online` 
            : partnerLastSeen 
              ? `${partnerName} active ${formatDistanceToNow(new Date(partnerLastSeen), { addSuffix: true })}`
              : `${partnerName} is Offline`}
        </span>
      </div>
    </div>
  );
}
