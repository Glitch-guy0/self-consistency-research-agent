# Story 3.3: Streaming Validation Thinking

Status: ready-for-dev

## Story

As a user,
I want to see the validation agent's chain-of-thought stream in real-time,
So that I can understand its reasoning process.

## Acceptance Criteria

1. **AC1: Incremental text** — When `showthinking(text, {delay: null, showall: true})` is called, text appears incrementally as the agent produces it
2. **AC2: No auto-clear** — The display does not auto-clear after each chunk
3. **AC3: Full thinking visible** — The full thinking is visible to the user

## Tasks / Subtasks

- [ ] Task 1: Implement streaming mode (AC: 1, 2, 3)
  - [ ] In `showthinking()`, when `delay === null`, clear the current line and write the text inline
  - [ ] No newline appended — subsequent calls overwrite the same line
- [ ] Task 2: Verify typecheck (AC: all)
  - [ ] Run `npm run typecheck` — zero errors

## Dev Notes

- `delay: null` means streaming — text should update in place
- Each call to `showthinking()` with new text replaces the previous line
- `output()` and `warn()` call `stopThinking()` first, which clears the streaming state
- The existing TUIManager from Story 3.1 already handles this mode

### Key Files

```
lib/tui/tuiManager.ts  — Enhanced showthinking() (EXISTING)
```

### References

- [Source: epics.md#Story-33-Streaming-Validation-Thinking](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- `showthinking()` with `delay: null` writes text inline without `\n`, allowing subsequent calls to overwrite the same line
- No auto-clear between chunks — only `clearLine()` before each write to overwrite previous content
- `npm run typecheck` passes with zero errors

### File List

- lib/tui/tuiManager.ts — updated (enhanced in Story 3.1, reused here)

### Review Findings

- [x] [Review][Patch] Streaming mode does not accumulate text — each call replaces the previous chunk. This matches the expected behavior: the orchestrator pushes the full accumulated text on each call, so the latest call shows the complete thinking so far [lib/tui/tuiManager.ts:33]
