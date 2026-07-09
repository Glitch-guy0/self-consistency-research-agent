# Story 3.4: Warning Notifications

Status: ready-for-dev

## Story

As a user,
I want to see warning notifications when optional features are unavailable,
So that I understand why certain capabilities are disabled.

## Acceptance Criteria

1. **AC1: Display warning** — When `warn("websearch disabled, falling back to internal knowledge")` is called, the warning message is displayed before agent dispatch
2. **AC2: Visually distinct** — The warning is visually distinct from normal output

## Tasks / Subtasks

- [ ] Task 1: Implement warn() method (AC: 1, 2)
  - [ ] `warn(message)` displays the message using chalk.yellow
  - [ ] Stops any active thinking animation before displaying warning
- [ ] Task 2: Verify typecheck (AC: all)
  - [ ] Run `npm run typecheck` — zero errors

## Dev Notes

- Use `chalk.yellow` for visual distinction
- `warn()` should call `stopThinking()` first to clear animated/streaming indicators
- The existing TUIManager from Story 3.1 already has a working `warn()` implementation

### Key Files

```
src/plugins/TUIManager.ts  — warn() method (EXISTING)
```

### References

- [Source: epics.md#Story-34-Warning-Notifications](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- `warn()` uses `chalk.yellow` for yellow-colored warning output
- Warn stops any active thinking animation before writing
- `npm run typecheck` passes with zero errors

### File List

- src/plugins/TUIManager.ts — updated (warn() implemented in Story 3.1, reused here)

### Review Findings

- [x] [Review][Decision] `warn()` currently uses chalk.yellow directly — when ITerminalPresenter (Story 3.5) is available, warn will delegate to `presenter.warning()`. For now, direct chalk usage satisfies the AC.
