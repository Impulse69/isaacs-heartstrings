# Development & Setup Guide

## Prerequisites
- **Node.js**: v18 or newer recommended.
- **Package Manager**: npm (Standard) or bun (lockfiles suggest Bun support).

## Getting Started

1. **Install Dependencies**
   Run the following command in the project root to install all required packages:
   ```bash
   npm install
   # or
   bun install
   ```

2. **Start the Development Server**
   Start the Vite server with Hot Module Replacement (HMR):
   ```bash
   npm run dev
   # or
   bun dev
   ```
   The application will be accessible at `http://localhost:5173`.

## Scripts Available
- `npm run dev`: Starts the local development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run build:dev`: Builds the app explicitly in development mode.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint for code formatting and standard checking.
- `npm run test`: Executes the Vitest testing suite.
- `npm run test:watch`: Runs Vitest in watch mode.

## Code Standards
- **TypeScript**: Strict typing is enforced. Avoid `any` types wherever possible.
- **Styling**: Component styles should rely on Tailwind classes. For consistent palettes, utilize the CSS variables defined in `src/index.css`.
- **Linting**: Ensure code passes `npm run lint` before committing.
