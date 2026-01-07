# Module Context

**Role**: maintain static data definitions, configurations, and type interfaces.
**Primary Function**: Source of truth for agent personas, ranks, and simulation constants.

# Tech Stack & Constraints

- **Language**: TypeScript (Interfaces, Types, Enums, Consts).
- **Environment**: Isomorphic (Code must be usable in both Client and Server components).

# Implementation Patterns

**Persona Definition**:
- All agents must strictly follow the `Agent` interface.
- Ranks should be an Enum or strictly typed Union.

**Data Consistency**:
- Ensure all IDs are unique.
- Image paths must be verified against `public/` directory.

# Testing Strategy

- Type checking (`tsc`) is the primary test.
- Verify data integrity manually if importing large JSONs.

# Local Golden Rules

**Do's**:
- **Do**: Use `readonly` for constant data arrays to prevent mutation.
- **Do**: Export interfaces and types clearly.

**Don'ts**:
- **Don't**: Put business logic or functions in data files (keep them pure data).
- **Don't**: Import React components here (avoids circular dependencies).
