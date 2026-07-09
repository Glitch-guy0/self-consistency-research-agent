import type { ITerminalPresenter } from "#lib/interface/iterminal-presenter.interface.ts";

/**
 * ITerminalPresenter implementation that writes plain text without ANSI codes.
 */
export class PlainPresenter implements ITerminalPresenter {
  /**
   * Render text without any styling.
   *
   * @param text - The text to render
   * @returns The same text unchanged
   *
   * @example
   * ```ts
   * const presenter = new PlainPresenter();
   * presenter.render("Hello", { color: "green" }); // returns "Hello"
   * ```
   */
  render(text: string, _opts?: { color?: string; bgcolor?: string; opacity?: number }): string {
    return text;
  }

  /**
   * Return success text without styling.
   *
   * @param text - The success text
   * @returns The same text unchanged
   *
   * @example
   * ```ts
   * presenter.success("Done");
   * ```
   */
  success(text: string): string {
    return text;
  }

  /**
   * Return failure text without styling.
   *
   * @param text - The failure text
   * @returns The same text unchanged
   *
   * @example
   * ```ts
   * presenter.fail("Error");
   * ```
   */
  fail(text: string): string {
    return text;
  }

  /**
   * Return warning text without styling.
   *
   * @param text - The warning text
   * @returns The same text unchanged
   *
   * @example
   * ```ts
   * presenter.warning("Caution");
   * ```
   */
  warning(text: string): string {
    return text;
  }
}
