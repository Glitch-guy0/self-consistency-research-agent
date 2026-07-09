# Story 2.3: JinaSearchProvider

Status: in-progress

## Story

As a developer,
I want a JinaSearchProvider that searches the web and parses page content via Jina API,
So that research agents can gather external information.

## Acceptance Criteria

1. **AC1**: `search(query)` hits `https://s.jina.ai/` with the query and returns markdown
2. **AC2**: `parse(url)` hits `https://r.jina.ai/` with the URL and returns page content
3. **AC3**: API key sent in Authorization header
4. **AC4**: Constructor falls back to `JINA_API_KEY` env var if no explicit apiKey provided

## Tasks / Subtasks

- [x] Task 1: Create `IWebSearchProvider` interface in `lib/interface/iweb-search-provider.interface.ts`
- [x] Task 2: Create `JinaSearchProvider` class in `lib/providers/jinaSearchProvider.provider.ts`
- [x] Task 3: Implement `search(query)` — fetch from `https://s.jina.ai/` with Authorization header
- [x] Task 4: Implement `parse(url)` — fetch from `https://r.jina.ai/` with Authorization header
- [x] Task 5: Wire constructor fallback to config.jinaApiKey or process.env.JINA_API_KEY
- [x] Task 6: Run `npm run typecheck` — zero errors

## Dev Notes

- Uses `fetch()` which is available globally in Node 18+
- API key sent as `Authorization: Bearer <key>` header
- Constructor:
  1. Explicit `apiKey` parameter if provided
  2. Fallback to `config.jinaApiKey` (from config util)
- Response body returned as text (markdown from Jina)

### Key Files to Create

```
lib/interface/iweb-search-provider.interface.ts  — IWebSearchProvider interface (NEW)
lib/providers/jinaSearchProvider.provider.ts      — JinaSearchProvider class (NEW)
```

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `IWebSearchProvider` interface with `search()` and `parse()` methods
- Created `JinaSearchProvider` class with config fallback
- `npm run typecheck` passes with zero errors

### Review Findings

- [x] [Review][Decision] Uses GET requests with query/url in the URL path (`encodeURIComponent` encoded) rather than POST. This matches the standard Jina API pattern.
- [x] [Review][Patch] `Accept: text/markdown` header added to inform Jina of desired response format [lib/providers/jinaSearchProvider.provider.ts:85]
- [x] [Review][Decision] API key fallback order: constructor arg → config.jinaApiKey → undefined. When undefined, requests are sent without auth header, which will result in a server error. The orchestrator (Story 2.4) is responsible for checking availability before composition.
- [x] [Review][Patch] JSDoc with `@example` on every method matches project convention.

### File List

- lib/interface/iweb-search-provider.interface.ts — new
- lib/providers/jinaSearchProvider.provider.ts — new
