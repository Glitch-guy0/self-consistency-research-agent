# Story 3.1: TUIManager Core

Status: ready-for-dev

## Story

As a developer,
I want the TUIManager with output(), input(), and clear() methods,
So that the orchestrator can communicate with the user via the terminal.

## Acceptance Criteria

1. **AC1: output(text)** — When `output(text)` is called, the text is displayed in the terminal
2. **AC2: input(placeholder)** — When `input(placeholder)` is called, the user is prompted and their input string is returned
3. **AC3: clear()** — When `clear()` is called, the current display is cleared
4. **AC4: implements ITUIManager** — TUIManager implements the ITUIManager interface

## Tasks / Subtasks

- [ ] Task 1: Create ITUIManager interface (AC: 4)
  - [ ] Create `lib/interface/itui-manager.interface.ts` with `showthinking()`, `clear()`, `output()`, `input()`, `warn()`
- [ ] Task 2: Implement TUIManager (AC: 1, 2, 3, 4)
  - [ ] `output(text)` writes to stdout
  - [ ] `input(placeholder)` uses readline to prompt and return user input
  - [ ] `clear()` clears the display using ANSI escape codes
  - [ ] `showthinking()` and `warn()` are basic stubs (enhanced in Stories 3.2, 3.3, 3.4)
- [ ] Task 3: Verify typecheck (AC: all)
  - [ ] Run `npm run typecheck` — zero errors

## Dev Notes

- Use `process.stdout.write()` for output
- Use `readline` module for input
- Use `\r\x1b[K` ANSI escape for line clearing
- Import `import type` for type-only imports
- JSDoc with `@example` on every public method
- No barrel files

### Key Files to Create

```
lib/interface/itui-manager.interface.ts    — ITUIManager interface (NEW)
lib/tui/tuiManager.ts                      — TUIManager implementation (NEW)
```

### References

- [Source: epics.md#Story-31-TUIManager-Core](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `lib/interface/itui-manager.interface.ts` with ITUIManager interface
- Created `lib/tui/tuiManager.ts` with TUIManager class implementing output(), input(), clear(), showthinking(), warn()
- `npm run typecheck` passes with zero errors

### File List

- lib/interface/itui-manager.interface.ts — new
- lib/tui/tuiManager.ts — new

### Review Findings

- [x] [Review][Decision] `render()` in ITerminalPresenter takes both `text` and styling opts (not just opts), returns `string` — deviated from spec sketch because the sketch omitted the text parameter, making it unusable. Added `text` param to `render()`.
- [x] [Review][Patch] `showthinking` default mode (no delay specified) fell through to `output()` — changed to write inline with `\n` suffix via stdout [lib/tui/tuiManager.ts:38]
- [x] [Review][Patch] Missing newline in `output()` after clearing thinking — added `\n` to output write [lib/tui/tuiManager.ts:32]
