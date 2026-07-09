/**
 * Port interface for agent notebook storage.
 *
 * Provides save/read operations scoped to a single agent session. Each
 * `NoteToolAdapter` instance is constructed with a unique session prefix so
 * that notebooks are fully isolated — one agent cannot read another agent's
 * notebook.
 *
 * @example
 * ```ts
 * import type { INoteToolPort } from "#lib/interface/iNoteToolPort.interface.ts";
 *
 * function run(noteTool: INoteToolPort): void {
 *   noteTool.save("step-1", { thought: "..." });
 *   const step = noteTool.read("step-1");
 * }
 * ```
 */
export interface INoteToolPort {
  /**
   * Stores `value` under `key` within this agent's notebook scope.
   *
   * @param key   — entry identifier (e.g., `"step-1"`)
   * @param value — any value to store
   *
   * @example
   * ```ts
   * noteTool.save("step-1", { type: "research", content: "..." });
   * ```
   */
  save(key: string, value: unknown): void;

  /**
   * Returns the value stored under `key`, or `undefined` if absent.
   *
   * @param key — entry identifier
   * @returns the stored value, or `undefined`
   *
   * @example
   * ```ts
   * const data = noteTool.read("step-1");
   * // data => { type: "research", content: "..." } or undefined
   * ```
   */
  read(key: string): unknown | undefined;
}
