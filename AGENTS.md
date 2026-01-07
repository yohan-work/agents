# Project Context & Operations

**Goal**: Build a Virtual Company Simulation where AI agents interact as employees in a hierarchical structure.
**Tech Stack**: Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, Framer Motion.

**Operational Commands**:
- **Start Dev Server**: `npm run dev`
- **Production Build**: `npm run build`
- **Lint Code**: `npm run lint`

# Golden Rules

**Immutable**:
- **500-Line Limit**: Keep all `AGENTS.md` files under 500 lines.
- **No Emojis**: Use strictly text-based documentation.
- **Strict TypeScript**: Do not use `any`; define interfaces for all data structures.

**Do's & Don'ts**:
- **Do**: Use `clsx` and `tailwind-merge` for conditional class names.
- **Do**: Use functional components with typed props.
- **Don't**: Use inline styles; rely on Tailwind utility classes.
- **Don't**: Commit secrets or API keys.

# Standards & References

- **Naming**: PascalCase for components (`MeetingRoom.tsx`), camelCase for utilities (`formatDate.ts`).
- **Commits**: Use semantic commit messages (e.g., `feat: add meeting room component`).
- **Maintenance**: Update this file if project structure or major dependencies change.

# Context Map

- **[API Routes & Server Logic](./app/api/AGENTS.md)** — Backend logic, Ollama integration, and chat endpoints.
- **[UI Components](./app/components/AGENTS.md)** — Visual components, design system implementation.
- **[Data & Types](./app/data/AGENTS.md)** — Static agent data, persona definitions, and TypeScript interfaces.
