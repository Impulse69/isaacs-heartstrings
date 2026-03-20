# Component Reference

This document details the critical frontend components powering the application's user interface.

## Core Screens
### `HomeScreen.tsx`
- **Purpose**: Acts as the primary landing dashboard. Displays the current progress (total questions answered, individual stats for Isaac, Ella, and Bible categories).
- **Interactions**: Allows the user to Start/Resume the game, or Reset the entire progress.

### `GameScreen.tsx`
- **Purpose**: The dynamic layer where the core gameplay loop occurs. 
- **Props**: Receives the `currentQuestion`, `totalAnswered`, and functions to handle answering or retreating to the home screen.
- **Integration**: Heavily utilizes `QuestionCard` and presents feedback dynamically.

## Interactive Components
### `PuzzleBoard.tsx`
- **Purpose**: A sophisticated 3x3 sliding/swapping puzzle minigame.
- **Mechanics**:
  - Implements a Fisher-Yates shuffle algorithm guaranteeing solvability.
  - Generates grid layers using specialized gradient `PATTERNS` and `EMOJIS` arrays.
  - Automatically verifies completion (`correctPos === currentPos` for all pieces) and signals the parent component.
- **Responsiveness**: Modifies puzzle dimensions based on screen real estate (using `sm:` queries).

### `QuestionCard.tsx`
- **Purpose**: Displays a single trivia question, its options, and captures the user's input. 

## UI Primitives
### Shadcn & Radix Components
Located inside `src/components/ui/`, these components form the foundation of inputs, modals, toasts, and buttons. They are fully customizable via Tailwind classes and provide robust accessibility (ARIA states) out of the box.
