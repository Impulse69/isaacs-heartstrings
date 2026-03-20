import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPinOff, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface GameModeSelectionProps {
  onSelect: (mode: "together" | "apart") => void;
}

export const GameModeSelection: React.FC<GameModeSelectionProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 to-pink-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              How are you playing?
            </CardTitle>
            <CardDescription className="text-rose-400 font-medium">
              Choose your adventure style for today
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-rose-100 hover:border-rose-300 hover:bg-rose-50/50 group transition-all duration-300"
              onClick={() => onSelect("together")}
            >
              <Users className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-bold text-rose-900">Together</div>
                <div className="text-xs text-rose-500">Sharing one phone in the same space</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-pink-100 hover:border-pink-300 hover:bg-pink-50/50 group transition-all duration-300"
              onClick={() => onSelect("apart")}
            >
              <MapPinOff className="w-6 h-6 text-pink-500 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-bold text-pink-900">Apart</div>
                <div className="text-xs text-pink-500">On two separate phones (Distance Mode)</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
