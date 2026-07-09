# Story 3.2: Animated Researching Indicator

Status: ready-for-dev

## Story

As a user,
I want to see an animated "researching..." indicator while research agents are running,
So that I know the system is processing my query.

## Acceptance Criteria

1. **AC1: Animated dots** — When `showthinking("researching...", {delay: 0, showall: true})` is called, animated dots cycle (e.g., ".", "..", "...") while agents run
2. **AC2: Auto clear** — The animation stops and clears when all research agents complete

## Tasks / Subtasks

- [ ] Task 1: Implement animated dots mode (AC: 1)
  - [ ] In `showthinking()`, when `delay === 0`, start a setInterval that cycles dot count 1→2→3→1...
  - [ ] Use `\r\x1b[K` to clear/re-render the line on each tick
- [ ] Task 2: Implement stop/clear on completion (AC: 2)
  - [ ] `clear()` calls `clearInterval()` and clears the line
- [ ] Task 3: Verify typecheck (AC: all)
  - [ ] Run `npm run typecheck` — zero errors

## Dev Notes

- `setInterval` at 500ms for dot cycling
- `clearInterval` stops the animation
- The existing TUIManager from Story 3.1 already has the `startDotAnimation` private method
- Animation cycles through 1, 2, 3 dots

### Key Files

```
src/plugins/TUIManager.ts  — Enhanced showthinking() + startDotAnimation() (EXISTING)
```

### References

- [Source: epics.md#Story-32-Animated-Researching-Indicator](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- `showthinking()` with `delay: 0` triggers `startDotAnimation()` which cycles ".", "..", "..." via setInterval
- `clear()` stops the interval and clears the display
- `npm run typecheck` passes with zero errors

### File List

- src/plugins/TUIManager.ts — updated (enhanced in Story 3.1, reused here)

### Review Findings

- [x] [Review][Decision] Dot animation cycles through 1, 2, 3 dots at 500ms intervals — single-frame animation, no flicker concern since `\r\x1b[K` clears before each write
- [x] [Review][Patch] `showthinking` with `delay: 0` should NOT append newline — writes inline without `\n` so the animation overwrites the same line [src/plugins/TUIManager.ts:30]
