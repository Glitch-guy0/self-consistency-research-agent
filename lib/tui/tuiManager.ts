import type { ITUIManager } from "#lib/interface/itui-manager.interface.ts";
import type { ITerminalPresenter } from "#lib/interface/iterminal-presenter.interface.ts";
import chalk from "chalk";

export class TUIManager implements ITUIManager {
  private thinkingInterval: ReturnType<typeof setInterval> | null = null;
  private presenter?: ITerminalPresenter;

  /**
   * @param presenter - Optional ITerminalPresenter for styled output
   */
  constructor(presenter?: ITerminalPresenter) {
    this.presenter = presenter;
  }

  /**
   * Show thinking/status text.
   *
   * @param text - The thinking text to display
   * @param opts - Options for display mode
   *
   * @example
   * ```ts
   * tui.showthinking("researching...", { delay: 0, showall: true });
   * ```
   */
  showthinking(text: string, opts?: { delay?: number | null; showall?: boolean }): void {
    this.stopThinking();

    if (opts?.delay === 0) {
      this.startDotAnimation(text);
    } else if (opts?.delay === null) {
      this.clearLine();
      process.stdout.write(text);
    } else {
      this.clearLine();
      process.stdout.write(text + "\n");
    }
  }

  /**
   * Clear the current thinking/status display.
   *
   * @example
   * ```ts
   * tui.clear();
   * ```
   */
  clear(): void {
    this.stopThinking();
    this.clearLine();
  }

  /**
   * Output permanent text to the terminal.
   *
   * @param text - The text to display
   *
   * @example
   * ```ts
   * tui.output("Analysis complete.");
   * ```
   */
  output(text: string): void {
    this.stopThinking();
    const display = this.presenter ? this.presenter.render(text) : text;
    process.stdout.write(display + "\n");
  }

  /**
   * Prompt the user for input and return the response.
   *
   * @param placeholder - Optional placeholder text shown as the prompt
   * @returns A promise that resolves to the user's input string
   *
   * @example
   * ```ts
   * const query = await tui.input("Enter your question: ");
   * ```
   */
  async input(placeholder?: string): Promise<string> {
    const { createInterface } = await import("node:readline");
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise<string>((resolve) => {
      rl.question(placeholder ?? "", (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Display a warning notification.
   *
   * @param message - The warning message to display
   *
   * @example
   * ```ts
   * tui.warn("API key not configured, feature disabled.");
   * ```
   */
  warn(message: string): void {
    this.stopThinking();
    const display = this.presenter ? this.presenter.warning(message) : chalk.yellow(message);
    process.stdout.write(display + "\n");
  }

  private stopThinking(): void {
    if (this.thinkingInterval !== null) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
  }

  private clearLine(): void {
    process.stdout.write("\r\x1b[K");
  }

  private startDotAnimation(text: string): void {
    let dotCount = 0;
    process.stdout.write(text);
    this.thinkingInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      this.clearLine();
      process.stdout.write(text + ".".repeat(dotCount));
    }, 500);
  }
}
