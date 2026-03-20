# Architecture Overview

## Executive Summary
Isaac's Heartstrings is a highly interactive, personalized web application designed to track user progress through various quiz categories and minigames. It is built as a Single Page Application (SPA).

## Technology Stack
- **Frontend Framework**: React 18
- **Language**: TypeScript for static type checking and improved developer experience
- **Build Tool**: Vite, providing fast Hot Module Replacement (HMR) and optimized builds
- **Routing**: React Router DOM for client-side routing
- **State Management**: React Hooks (primarily custom hooks like `useGameState`)
- **Data Fetching/Caching**: TanStack React Query v5
- **Styling**: Tailwind CSS for utility-first styling with responsive, accessible UI primitives provided by Shadcn UI and Radix UI
- **Animations**: canvas-confetti, tailwindcss-animate

## Core Structure
- `/src/components`: Contains reusable UI components and screen layouts (`PuzzleBoard`, `HomeScreen`, `GameScreen`).
- `/src/pages`: Top-level route components (`Index`, `NotFound`).
- `/src/hooks`: Custom React hooks containing specialized state logic (`useGameState.ts`, `use-toast.ts`).
- `/src/data`: Static datasets feeding into the trivia system (`isaacQuestions.ts`, `ellaQuestions.ts`, `bibleQuestions.ts`).

## Architectural Patterns
- **Component-Based Architecture**: The application employs strict separation of concerns, managing complex minigame boards separately from the state engine answering questions.
- **Custom Hooks**: Business logic is abstracted into hooks to keep components purely focused on presentation. `useGameState` exposes properties for rendering while internalizing state logic.
