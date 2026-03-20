
# 🧩 Isaac & Ella's Puzzle Quest

## Concept
A jigsaw-style puzzle game for two. Solve each puzzle to unlock a question — romantic ones about Isaac for Ella to answer, questions about Ella for Isaac, and Bible character quizzes you guess together.

## Game Flow
1. **Home Screen** — Cute welcome with both names, a heart theme, and "Start Playing" button. Shows progress (X/300 questions answered).
2. **Puzzle Screen** — A jigsaw puzzle using romantic/cute illustrations (generated with CSS gradients & emoji art). The image is split into draggable pieces (3x3 grid = 9 pieces). Drag pieces to the correct spots. On completion → confetti animation → question card appears.
3. **Question Card** — Slides up with the question. Three types visually distinguished:
   - 💕 **"Ella, answer this about Isaac"** (180 questions) — Medium-spice romantic/flirty questions about Isaac's preferences, habits, memories, and feelings
   - 💜 **"Isaac, answer this about Ella"** (30 questions) — Questions about Ella for Isaac to answer
   - 📖 **"Bible Character Quiz"** (90 questions) — "Who am I?" style clues about a Bible character. A "Reveal Answer" button shows the answer after guessing vocally
4. **After answering** → tap "Next Puzzle" to get a new puzzle + question combo

## Question Design (300 total, no repeats)
- **180 romantic/spicy about Isaac** — e.g. "What's Isaac's love language?", "What outfit of Isaac's drives you crazy?", "If Isaac could take you anywhere tonight, where would it be?", "What's the first thing you noticed about Isaac?"
- **30 about Ella** — e.g. "What's Ella's comfort food?", "What makes Ella laugh the hardest?"
- **90 Bible character quizzes** — Clue-based: "I was swallowed by a great fish" → Reveal: Jonah. Covers OT & NT characters with varying difficulty

## Puzzle Mechanics
- Each round shows a colorful image (heart patterns, couple silhouettes, nature scenes via CSS/SVG)
- Image split into 9 draggable pieces shuffled on a board
- Drag & drop pieces to correct grid positions
- Visual feedback: pieces snap into place when correct, glow effect
- Completion triggers confetti + question reveal

## UI/UX
- **Mobile-first** (you'll be on phones together)
- Warm color palette: soft pinks, purples, gold accents
- Smooth animations for puzzle solving and question reveals
- Progress tracker showing how many questions completed per category
- Option to shuffle/skip a puzzle if stuck (but encouraged to solve)
- All 300 questions randomized so each session feels fresh
- No backend needed — all questions stored locally, progress saved in localStorage
