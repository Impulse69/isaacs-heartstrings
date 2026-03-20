# State Management

## Overview
State management inside Isaac Love Quests focuses on minimizing global state footprints while ensuring components re-render effectively when game progress dictates. The app currently abstains from heavy reducers (e.g., Redux), preferring highly specialized custom hooks.

## `useGameState.ts`
The core logic backbone for the entire application is enclosed within this hook.

### Key Responsibilities:
1. **Aggregating Data Sources**: Merges the static datasets (`isaacQuestions`, `ellaQuestions`, `bibleQuestions`) into a unified progression map.
2. **Progress Tracking**: Keeps independent counters for:
   - `totalAnswered`
   - `isaacAnswered`
   - `ellaAnswered`
   - `bibleAnswered`
3. **Session Persistence**: (If implemented) Loads existing progress on mount to prevent loss of state across page reloads.
4. **Action Dispatching**: Exposes robust modifiers:
   - `markAnswered()`
   - `resetGame()`

### Data Flow
- **Initialization**: `<Index>` initializes `useGameState()`.
- **Top-Down Prop Passing**: State values are passed deterministically to `<HomeScreen>` and `<GameScreen>`.
- **Event Bubbling**: Interactions inside `<QuestionCard>` or `<PuzzleBoard>` trigger the callbacks passed from `<GameScreen>`, which in turn invoke methods bounded to `useGameState`.

## Future Considerations
- If state complexifies further (e.g., tracking a deep event history or multiplayer modes), transitioning `useGameState` to a React Context Provider or adopting a lightweight library like Zustand would be optimal to avoid prop-drilling through deeply nested minigames.
