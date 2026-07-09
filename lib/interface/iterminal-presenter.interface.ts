/**
 * Optional terminal presenter interface for styled output.
 * Implementations apply ANSI styling (ChalkPresenter) or plain text (PlainPresenter).
 */
export interface ITerminalPresenter {
  /**
   * Render text with optional style parameters.
   *
   * @param text - The text to render
   * @param opts - Styling options:
   *   - color: text color name (e.g. "red", "green", "yellow")
   *   - bgcolor: background color name (e.g. "red", "blue")
   *   - opacity: not directly supported by chalk, ignored
   * @returns The styled string
   *
   * @example
   * ```ts
   * presenter.render("Hello", { color: "green" });
   * ```
   */
  render(text: string, opts?: { color?: string; bgcolor?: string; opacity?: number }): string;

  /**
   * Render a success message (typically green).
   *
   * @param text - The success text
   * @returns The styled string
   *
   * @example
   * ```ts
   * presenter.success("Task completed");
   * ```
   */
  success(text: string): string;

  /**
   * Render a failure/error message (typically red).
   *
   * @param text - The failure text
   * @returns The styled string
   *
   * @example
   * ```ts
   * presenter.fail("Task failed");
   * ```
   */
  fail(text: string): string;

  /**
   * Render a warning message (typically yellow).
   *
   * @param text - The warning text
   * @returns The styled string
   *
   * @example
   * ```ts
   * presenter.warning("API key not configured");
   * ```
   */
  warning(text: string): string;
}
