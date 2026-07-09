import chalk from "chalk";
import type { ITerminalPresenter } from "#lib/interface/iterminal-presenter.interface.ts";

type ChalkFn = (s: string) => string;

/**
 * ITerminalPresenter implementation using Chalk for ANSI-styled terminal output.
 */
export class ChalkPresenter implements ITerminalPresenter {
  /**
   * Render text with optional chalk-based styling.
   *
   * @param text - The text to render
   * @param opts - Styling options (color name, bgcolor name)
   * @returns The ANSI-styled string
   *
   * @example
   * ```ts
   * const presenter = new ChalkPresenter();
   * presenter.render("Hello", { color: "green" });
   * ```
   */
  render(text: string, opts?: { color?: string; bgcolor?: string; opacity?: number }): string {
    let result: string = text;

    if (opts?.color) {
      const colorFn = (chalk as unknown as Record<string, ChalkFn>)[opts.color];
      if (colorFn) {
        result = colorFn(result);
      }
    }

    if (opts?.bgcolor) {
      const bgKey = "bg" + opts.bgcolor.charAt(0).toUpperCase() + opts.bgcolor.slice(1);
      const bgFn = (chalk as unknown as Record<string, ChalkFn>)[bgKey];
      if (bgFn) {
        result = bgFn(result);
      }
    }

    return result;
  }

  /**
   * Render a success message in green.
   *
   * @param text - The success text
   * @returns The green-styled string
   *
   * @example
   * ```ts
   * presenter.success("Done");
   * ```
   */
  success(text: string): string {
    return this.render(text, { color: "green" });
  }

  /**
   * Render a failure message in red.
   *
   * @param text - The failure text
   * @returns The red-styled string
   *
   * @example
   * ```ts
   * presenter.fail("Error");
   * ```
   */
  fail(text: string): string {
    return this.render(text, { color: "red" });
  }

  /**
   * Render a warning message in yellow.
   *
   * @param text - The warning text
   * @returns The yellow-styled string
   *
   * @example
   * ```ts
   * presenter.warning("Caution");
   * ```
   */
  warning(text: string): string {
    return this.render(text, { color: "yellow" });
  }
}
