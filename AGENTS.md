# AGENTS.md

## Build, Lint, and Test Commands

- **Package manager:** bun@1.2.20 (see packageManager field in package.json)
- **Development server:** `bun run dev`
- **Build:** `bun run build`
- **Preview production build:** `bun run preview`
- **Typecheck:** `bun run check`
- **Typecheck (watch):** `bun run check:watch`
- **Lint:** `bun run lint` (runs Prettier and ESLint)
- **Format:** `bun run format`
- **Run a single test:** _No test script found; add test script if needed._

## Code Style Guidelines

- **Formatting:** Use tabs, single quotes, trailing commas disabled, print width 100.
- **Prettier plugins:** Svelte, TailwindCSS.
- **Linting:** ESLint with recommended JS, TypeScript, and Svelte rules. `no-undef` is disabled for TypeScript.
- **Imports:** Use ES module syntax.
- **Types:** Prefer explicit TypeScript types.
- **Naming:** Use descriptive, camelCase for variables/functions, PascalCase for components.
- **Error Handling:** Use try/catch for async code; handle errors gracefully.
- **Globals:** Browser and Node globals are available.
- **Svelte:** Use `.svelte` files for components; follow Svelte best practices.
- **TailwindCSS:** Stylesheet at `src/app.css`.
