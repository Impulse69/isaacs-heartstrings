import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PlayerRole } from "@/hooks/useGameState";
import { MapPin, MapPinOff, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocationTrackerProps {
  playerRole: PlayerRole | null;
  onClose: () => void;
}

export function LocationTracker({ playerRole, onClose }: LocationTrackerProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ellaLocation, setEllaLocation] = useState<{ lat: number; lng: number; updated: string } | null>(null);

  // Subscribe to Ella's location if Isaac is viewing
  useEffect(() => {
    if (playerRole === "isaac") {
      const fetchEllaLocation = async () => {
        const { data, error } = await supabase
          .from("player_locations")
          .select("latitude, longitude, updated_at")
          .eq("player_role", "ella")
          .maybeSingle();
        
        if (data && !error) {
          setEllaLocation({ lat: data.latitude, lng: data.longitude, updated: data.updated_at });
        }
      };

      fetchEllaLocation();

      const channel = supabase
        .channel('ella_location_updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'player_locations', filter: 'player_role=eq.ella' },
          (payload) => {
            const newLoc = payload.new as any;
            if (newLoc) {
              setEllaLocation({ lat: newLoc.latitude, lng: newLoc.longitude, updated: newLoc.updated_at });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [playerRole]);

  // Handle Location Sharing for Ella
  useEffect(() => {
    let watchId: number;

    if (playerRole === "ella" && isSharing) {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        setIsSharing(false);
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await supabase.from("player_locations").upsert({
            player_role: "ella",
            latitude,
            longitude,
            updated_at: new Date().toISOString()
          });
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Failed to get location. Please allow permissions.");
          setIsSharing(false);
        },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [playerRole, isSharing]);

  const googleMapsUrl = ellaLocation 
    ? `https://www.google.com/maps?q=${ellaLocation.lat},${ellaLocation.lng}`
    : null;

  return (
    <div className="flex flex-col gap-6 animate-scale-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          {playerRole === "ella" ? "Location Sharing" : "Where is She? 📍"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {playerRole === "ella" 
            ? "Toggle this to allow Isaac to see where you are for his surprise visit!" 
            : "If Ella allows sharing, you'll see her real-time spot here."}
        </p>
      </div>

      <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border-2 border-primary/20 shadow-sm text-center">
        {playerRole === "ella" ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center transition-colors ${isSharing ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
              {isSharing ? <MapPin className="w-10 h-10 animate-bounce" /> : <MapPinOff className="w-10 h-10" />}
            </div>
            <p className={`font-bold ${isSharing ? 'text-green-600' : 'text-rose-500'}`}>
              {isSharing ? "REAL-TIME SHARING ACTIVE" : "SHARING DISABLED"}
            </p>
            <Button 
              size="lg" 
              variant={isSharing ? "destructive" : "default"}
              className="w-full shadow-lg h-12"
              onClick={() => setIsSharing(!isSharing)}
            >
              {isSharing ? "Stop Sharing Location" : "Allow Location Access ✨"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {ellaLocation ? (
              <>
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                  <p className="text-sm font-medium text-foreground">Last updated: {new Date(ellaLocation.updated).toLocaleTimeString()}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Lat: {ellaLocation.lat.toFixed(6)}, Lng: {ellaLocation.lng.toFixed(6)}
                  </p>
                </div>
                <Button 
                  asChild
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg text-white gap-2 h-12"
                >
                  <a href={googleMapsUrl!} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </>
            ) : (
              <div className="p-8 space-y-3 opacity-50">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm">Waiting for Ella to enable sharing...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Back to Dashboard
      </Button>
    </div>
  );
}
