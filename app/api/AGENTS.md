# Module Context

**Role**: Handle server-side logic, API interactions, and AI model communication.
**Primary Function**: Serve as the backend layer for the simulation, managing chat streams and agent logic.

# Tech Stack & Constraints

- **Framework**: Next.js App Router (Route Handlers).
- **AI Integration**: Ollama (local LLM) or OpenAI compatible APIs.
- **Restrictions**: 
  - No client-side code (`use client` is forbidden here).
  - Use `NextResponse` or standard `Response` objects.

# Implementation Patterns

**Route Structure**:
- File name must be `route.ts`.
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`.

**Error Handling**:
- Wrap logic in `try-catch` blocks.
- Return structured JSON errors: `{ error: "Message", status: 500 }`.

**Streaming**:
- For AI responses, use usage `StreamingTextResponse` or native streams.

# Testing Strategy

- Use Postman or `curl` to verify endpoints.
- Mock external AI calls during standard unit tests.

# Local Golden Rules

**Do's**:
- **Do**: Validate `req.json()` body content using Zod or manual checks.
- **Do**: Set appropriate timeouts for long-running AI tasks.

**Don'ts**:
- **Don't**: Store state in global variables (serverless environment serves separate requests).
- **Don't**: Expose internal error stack traces to the client.
