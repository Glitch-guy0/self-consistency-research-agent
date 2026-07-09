/**
 * Port interface for session lifecycle management.
 *
 * Provides init/get/set/delete operations for both persistent Conversation
 * Sessions and temporary Agent Sessions. The orchestrator owns the persistent
 * session; temp sessions are created per query cycle and deleted after use.
 *
 * @example
 * ```ts
 * import type { ISessionPort } from "#lib/interface/iSessionPort.interface.ts";
 *
 * function manage(session: ISessionPort): void {
 *   session.init("conv-1");
 *   session.set("conv-1", { messages: [] });
 *   const data = session.get("conv-1");
 *   session.delete("conv-1");
 * }
 * ```
 */
export interface ISessionPort {
  /**
   * Initialises a session with an empty state. **Does not overwrite** an
   * existing session — if `id` already exists this is a no-op.
   *
   * @param id — unique session identifier
   *
   * @example
   * ```ts
   * session.init("agent-session-1");
   * session.init("agent-session-1"); // no-op, data preserved
   * ```
   */
  init(id: string): void;

  /**
   * Returns the session data for `id`, or `undefined` if the session does
   * not exist.
   *
   * @param id — session identifier
   * @returns the stored data, or `undefined`
   *
   * @example
   * ```ts
   * const data = session.get("conv-1");
   * // data => { messages: [] } or undefined
   * ```
   */
  get(id: string): unknown | undefined;

  /**
   * Stores `data` under `id`, overwriting any existing value.
   *
   * @param id   — session identifier
   * @param data — session data to store
   *
   * @example
   * ```ts
   * session.set("conv-1", { messages: [{ role: "user", content: "hello" }] });
   * ```
   */
  set(id: string, data: unknown): void;

  /**
   * Removes the session under `id`. No-op if the session does not exist.
   *
   * @param id — session identifier to remove
   *
   * @example
   * ```ts
   * session.delete("agent-session-1");
   * session.get("agent-session-1"); // undefined
   * ```
   */
  delete(id: string): void;
}
