# Module Context

**Role**: Present the user interface and handle user interactions.
**Primary Function**: Render the simulation visuals, meeting rooms, and agent avatars.

# Tech Stack & Constraints

- **Framework**: React 19 (Server & Client Components).
- **Styling**: Tailwind CSS 4.
- **Animation**: Framer Motion.
- **Icons**: Lucide React.

# Implementation Patterns

**Component Types**:
- **Server Components**: Default choice. Use for fetching data or static layout.
- **Client Components**: Add `"use client"` at the top only for interactivity (`onClick`, `useState`, `useEffect`).

**Styling**:
- Use utility classes primarily.
- Use `clsx` and `tailwind-merge` for dynamic classes:
  ```typescript
  className={cn("base-class", className)}
  ```

# Testing Strategy

- Verify responsiveness on mobile/desktop.
- Check accessibility (keyboard navigation) for interactive elements.

# Local Golden Rules

**Do's**:
- **Do**: Extract complex logic into custom hooks (in `app/hooks` or `app/lib`).
- **Do**: Keep components focused on a single responsibility.

**Don'ts**:
- **Don't**: Import heavy libraries in Client Components if not needed (bundle size).
- **Don't**: modifying props directly (props are read-only).
