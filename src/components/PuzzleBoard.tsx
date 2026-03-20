import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PuzzlePiece {
  id: number;
  currentPos: number;
  correctPos: number;
}

// Generate a shuffled puzzle that's always solvable
function createPuzzle(): PuzzlePiece[] {
  const pieces: PuzzlePiece[] = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    currentPos: i,
    correctPos: i,
  }));

  // Fisher-Yates shuffle positions
  const positions = Array.from({ length: 9 }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // If already solved, swap first two
  if (positions.every((p, i) => p === i)) {
    [positions[0], positions[1]] = [positions[1], positions[0]];
  }

  return pieces.map((p, i) => ({ ...p, currentPos: positions[i] }));
}

// Unique romance images for puzzle rounds
const PUZZLE_IMAGES = Array.from({ length: 100 }, (_, i) => 
  `${import.meta.env.BASE_URL}images/puzzles/puzzle_${(i % 25) + 1}.png`
);

const EMOJIS = ["💕", "🌹", "✨", "💖", "🦋", "🌸", "💫", "🔥", "💗", "🌺", "⭐", "💘"];

interface PuzzleBoardProps {
  onSolved: () => void;
  roundNumber: number;
}

export default function PuzzleBoard({ onSolved, roundNumber }: PuzzleBoardProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>(createPuzzle);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [showReference, setShowReference] = useState(false);

  const currentImage = PUZZLE_IMAGES[roundNumber % PUZZLE_IMAGES.length];
  const emoji1 = EMOJIS[roundNumber % EMOJIS.length];
  const emoji2 = EMOJIS[(roundNumber + 4) % EMOJIS.length];


  // Check if solved
  useEffect(() => {
    if (pieces.length > 0 && pieces.every((p) => p.currentPos === p.correctPos)) {
      setSolved(true);
      const timer = setTimeout(onSolved, 600);
      return () => clearTimeout(timer);
    }
  }, [pieces, onSolved]);

  const handleTap = useCallback(
    (posIndex: number) => {
      if (solved) return;

      if (selectedPiece === null) {
        setSelectedPiece(posIndex);
      } else {
        if (selectedPiece === posIndex) {
          setSelectedPiece(null);
          return;
        }
        // Swap pieces at selectedPiece and posIndex
        setPieces((prev) =>
          prev.map((p) => {
            if (p.currentPos === selectedPiece) return { ...p, currentPos: posIndex };
            if (p.currentPos === posIndex) return { ...p, currentPos: selectedPiece };
            return p;
          })
        );
        setMoveCount((c) => c + 1);
        setSelectedPiece(null);
      }
    },
    [selectedPiece, solved]
  );

  // Build grid: position -> piece
  const grid = useMemo(() => {
    const g: (PuzzlePiece | undefined)[] = Array(9).fill(undefined);
    pieces.forEach((p) => {
      g[p.currentPos] = p;
    });
    return g;
  }, [pieces]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[288px] sm:max-w-[324px] px-1 mb-2">
        <span className="text-sm text-muted-foreground">Tap two pieces to swap</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{moveCount} moves</span>
          <button 
            onClick={() => setShowReference(true)}
            className="group relative active:scale-95 transition-transform"
          >
            <img 
              src={currentImage} 
              alt="Reference Thumbnail" 
              className="w-10 h-10 rounded-md border shadow-sm opacity-90 object-cover" 
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors rounded-md flex items-center justify-center">
              <span className="text-[10px] text-white font-bold drop-shadow-md">🔍</span>
            </div>
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Puzzle grid */}
        <div className="grid grid-cols-3 gap-1 w-[288px] h-[288px] sm:w-[324px] sm:h-[324px] rounded-xl overflow-hidden p-1 bg-border/50">
          {grid.map((piece, posIndex) => {
            if (!piece) return <div key={posIndex} />;

            const isCorrect = piece.currentPos === piece.correctPos;
            const isSelected = selectedPiece === posIndex;

            // Calculate the background position for this piece's correct image slice
            const row = Math.floor(piece.correctPos / 3);
            const col = piece.correctPos % 3;

            return (
              <button
                key={posIndex}
                onClick={() => handleTap(posIndex)}
                className={`
                  relative aspect-square rounded-lg transition-all duration-200 overflow-hidden
                  active:scale-95 select-none touch-manipulation
                  ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10" : ""}
                  ${isCorrect && !solved ? "ring-1 ring-accent/40" : ""}
                  ${solved ? "ring-2 ring-accent" : ""}
                `}
                style={{
                  backgroundImage: `url(${currentImage})`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${col * 50}% ${row * 50}%`,
                }}
                aria-label={`Puzzle piece ${piece.id + 1}`}
              >
                {/* Correct indicator */}
                {isCorrect && !solved && (
                  <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Solved overlay */}
        {solved && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 rounded-xl backdrop-blur-sm animate-fade-in">
            <span className="text-4xl">🎉</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReference && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReference(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={currentImage} 
                alt="Full Reference" 
                className="w-full h-auto rounded-2xl border-2 border-white/20 shadow-2xl" 
              />
              <button 
                onClick={() => setShowReference(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold shadow-lg active:scale-95 transition-transform"
              >
                ✕
              </button>
              <p className="text-white/80 text-center mt-4 font-medium text-sm">
                This is what the completed puzzle looks like! ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
