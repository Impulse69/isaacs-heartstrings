import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Lock, User, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlayerIdentityProps {
  onVerify: (role: "isaac" | "ella", pin: string) => void;
}

export const PlayerIdentity: React.FC<PlayerIdentityProps> = ({ onVerify }) => {
  const [selectedRole, setSelectedRole] = useState<"isaac" | "ella" | null>(null);
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || isVerifying) return;
    if (pin.length < 4) {
      toast({
        title: "PIN too short",
        description: "Please enter your 4-digit secret passcode.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // 1. Check if role exists in DB
      const { data, error } = await supabase
        .from('player_identities')
        .select('pin_hash')
        .eq('role', selectedRole)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        // Role exists, check PIN
        if (data.pin_hash === pin) {
          onVerify(selectedRole, pin);
        } else {
          toast({
            title: "Access Denied",
            description: "Incorrect PIN for this role.",
            variant: "destructive",
          });
        }
      } else {
        // Role does not exist, insert new PIN
        const { error: insertError } = await supabase
          .from('player_identities')
          .insert([{ role: selectedRole, pin_hash: pin }]);
          
        if (insertError) throw insertError;
        
        toast({
          title: "Setup Complete",
          description: `PIN successfully registered for ${selectedRole}.`,
        });
        onVerify(selectedRole, pin);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Connection Error",
        description: "Could not connect to the secure server.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 to-pink-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-rose-100 rounded-full relative">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                <Lock className="w-4 h-4 text-rose-600 absolute bottom-0 right-0" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Who is playing?
            </CardTitle>
            <CardDescription className="text-rose-400">
              Verify your identity to secure your records
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={selectedRole === "isaac" ? "default" : "outline"}
                  className={`flex-1 h-20 gap-2 border-2 transition-all ${
                    selectedRole === "isaac" 
                      ? "bg-rose-500 border-rose-600 hover:bg-rose-600" 
                      : "border-rose-100 hover:border-rose-300 hover:bg-rose-50"
                  }`}
                  onClick={() => setSelectedRole("isaac")}
                >
                  <User className="w-5 h-5" />
                  <span className="font-bold">Isaac</span>
                </Button>
                <Button
                  type="button"
                  variant={selectedRole === "ella" ? "default" : "outline"}
                  className={`flex-1 h-20 gap-2 border-2 transition-all ${
                    selectedRole === "ella" 
                      ? "bg-pink-500 border-pink-600 hover:bg-pink-600" 
                      : "border-pink-100 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                  onClick={() => setSelectedRole("ella")}
                >
                  <UserCheck className="w-5 h-5" />
                  <span className="font-bold">Ella</span>
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="pin" className="text-rose-900 font-semibold">Your Secret 4-Digit Passcode</Label>
                    <Input
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      className="text-center text-2xl tracking-[1em] h-14 border-rose-200 focus:ring-rose-500 focus:border-rose-500"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200"
                disabled={!selectedRole || pin.length < 4}
              >
                Secure Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
