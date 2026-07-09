---
baseline_commit: HEAD
---

# Story 4.5: Validation Agent with Confidence Scoring

Status: in-progress

## Story

As a user,
I want the validation agent to analyze all research outputs and show confidence scores,
so that I see synthesized answers when agents agree and diverging results when they disagree.

## Acceptance Criteria

1. **AC1: Note-only toolset** — Validation agent receives note-only toolset (no websearch)
2. **AC2: Streaming thinking** — Intermediate validation thinking streams via showthinking()
3. **AC3: Converged** — When outputs converge, a synthesized answer is produced
4. **AC4: Diverged** — When outputs diverge, confidence scores + differing results shown
5. **AC5: Conversation append** — Final answer appended to Conversation Session as `{assistant}`
6. **AC6: Temp cleanup** — Validation agent's temp session deleted after append
7. **AC7: Confidence scoring** — Based on agreement-strength and citation overlap, not raw model logprobs

## Tasks / Subtasks

- [ ] Task 1: Validation dispatch in Orchestrator (AC: 1-7)
  - [ ] Create validation agent with note-only toolset
  - [ ] Show intermediate thinking via showthinking
  - [ ] Append result to conversation session
  - [ ] Clean up validation temp session
- [ ] Task 2: Verify typecheck
  - [ ] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] Confidence scoring is delegated to the LLM via the `VALIDATION_SYSTEM_PROMPT` — the LLM is instructed to analyze agreement-strength and citation overlap (AR-8)
- [x] [Review][Decision] Validation agent receives note-only toolset (no `webSearch`) — `createValidationAgent` is called with `tools: { note: validationNoteTool }`  
- [x] [Review][Decision] Research outputs are serialised as `[{agent: 1, content: "..."}, ...]` — structured input for the validation LLM
- [x] [Review][Patch] Validation result appended as `{assistant}` to Conversation Session BEFORE validation temp session is deleted — ensures the conversation is updated even if deletion fails [src/modules/Orchestrator.ts:188-195]
- [x] [Review][Patch] `updatedConv` is retrieved again from the session before mutation — guarantees we have the latest reference from KVCache [src/modules/Orchestrator.ts:187]