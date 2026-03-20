import { useState, useCallback, useEffect, useMemo } from "react";

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

// CSS gradient patterns for puzzle images
const PATTERNS = [
  "linear-gradient(135deg, hsl(340 70% 65%) 0%, hsl(300 50% 70%) 50%, hsl(42 80% 65%) 100%)",
  "radial-gradient(circle at 30% 40%, hsl(340 65% 60%) 0%, hsl(280 45% 55%) 60%, hsl(320 60% 45%) 100%)",
  "linear-gradient(45deg, hsl(42 85% 60%) 0%, hsl(340 60% 55%) 50%, hsl(280 50% 60%) 100%)",
  "conic-gradient(from 45deg, hsl(340 65% 55%), hsl(42 80% 65%), hsl(280 50% 60%), hsl(340 65% 55%))",
  "linear-gradient(160deg, hsl(280 50% 65%) 0%, hsl(340 70% 60%) 40%, hsl(42 75% 60%) 100%)",
  "radial-gradient(ellipse at 70% 30%, hsl(42 80% 70%) 0%, hsl(340 60% 55%) 50%, hsl(280 40% 50%) 100%)",
];

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

  const pattern = PATTERNS[roundNumber % PATTERNS.length];
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
      <div className="flex items-center justify-between w-full max-w-[320px] px-1">
        <span className="text-sm text-muted-foreground">Tap two pieces to swap</span>
        <span className="text-sm font-medium text-muted-foreground">{moveCount} moves</span>
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
                  background: pattern,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${col * 50}% ${row * 50}%`,
                }}
                aria-label={`Puzzle piece ${piece.id + 1}`}
              >
                {/* Emoji overlay */}
                <span
                  className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl opacity-80 pointer-events-none"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                >
                  {piece.correctPos % 2 === 0 ? emoji1 : emoji2}
                </span>

                {/* Piece number */}
                <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white/60 pointer-events-none">
                  {piece.correctPos + 1}
                </span>

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
    </div>
  );
}
