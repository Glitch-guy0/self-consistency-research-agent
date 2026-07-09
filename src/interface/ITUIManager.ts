/**
 * Port interface for terminal UI management.
 *
 * Provides display operations for the CLI — permanent output, user input
 * prompts, streaming thinking visualisation, warning notifications, and
 * display clearing.
 *
 * @example
 * ```ts
 * import type { ITUIManager } from "#src/interface/ITUIManager.ts";
 *
 * async function example(tui: ITUIManager) {
 *   tui.output("Hello, world!");
 *   const input = await tui.input("Ask something: ");
 *   tui.warn("optional feature unavailable");
 * }
 * ```
 */
export interface ITUIManager {
  /**
   * Displays streaming thinking text in the terminal.
   *
   * When `opts.delay === 0` the text animates with a dot spinner.
   * When `opts.delay === null` the text is shown as a persistent single line.
   * When `opts.showall` is `true` the full text is visible.
   *
   * @param text — the thinking text to display
   * @param opts — optional display configuration
   *
   * @example
   * ```ts
   * tui.showthinking("researching", { delay: 0, showall: true });
   * tui.showthinking("analysing...", { showall: false });
   * ```
   */
  showthinking(text: string, opts?: { delay?: number | null; showall?: boolean }): void;

  /**
   * Clears the current thinking display from the terminal.
   *
   * @example
   * ```ts
   * tui.clear();
   * ```
   */
  clear(): void;

  /**
   * Writes a chunk of text to the terminal without a trailing newline.
   * Used for streaming incremental output (e.g. token-by-token from an LLM).
   *
   * @param chunk — the text chunk to append to the current output
   *
   * @example
   * ```ts
   * for (const token of tokens) { tui.write(token); }
   * tui.output(""); // final newline
   * ```
   */
  write(chunk: string): void;

  /**
   * Permanently displays `text` in the terminal (not cleared on next
   * thinking update).
   *
   * @param text — the text to display
   *
   * @example
   * ```ts
   * tui.output("Final answer: 42");
   * ```
   */
  output(text: string): void;

  /**
   * Prompts the user for input with an optional placeholder and returns
   * the entered string.
   *
   * @param placeholder — optional placeholder text shown in the prompt
   * @returns a promise that resolves to the user's input
   *
   * @example
   * ```ts
   * const query = await tui.input("Enter your question: ");
   * ```
   */
  input(placeholder: string): Promise<string>;

  /**
   * Displays a warning notification that is visually distinct from normal
   * output.
   *
   * @param text — the warning message
   *
   * @example
   * ```ts
   * tui.warn("websearch disabled, falling back to internal knowledge");
   * ```
   */
  warn(text: string): void;
}
