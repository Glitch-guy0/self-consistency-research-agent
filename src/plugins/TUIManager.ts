import type { ITUIManager } from "#src/interface/ITUIManager.ts";
import type { ITerminalPresenter } from "#src/interface/ITerminalPresenter.ts";
import chalk from "chalk";

export class TUIManager implements ITUIManager {
  private thinkingInterval: ReturnType<typeof setInterval> | null = null;
  private presenter?: ITerminalPresenter;

  constructor(presenter?: ITerminalPresenter) {
    this.presenter = presenter;
  }

  showthinking(text: string, opts?: { delay?: number | null; showall?: boolean }): void {
    this.stopThinking();

    if (opts?.delay === 0) {
      this.startDotAnimation(this.presenter ? this.presenter.render(text, { color: "cyan" }) : text);
    } else if (opts?.delay === null) {
      this.clearLine();
      process.stdout.write(this.presenter ? this.presenter.render(text, { color: "cyan" }) : text);
    } else {
      this.clearLine();
      process.stdout.write(this.presenter ? this.presenter.render(text, { color: "cyan" }) : text);
      process.stdout.write("\n");
    }
  }

  write(chunk: string): void {
    this.stopThinking();
    process.stdout.write(this.presenter ? this.presenter.render(chunk) : chunk);
  }

  clear(): void {
    this.stopThinking();
    this.clearLine();
  }

  output(text: string): void {
    this.stopThinking();
    const display = this.presenter ? this.presenter.render(text) : text;
    process.stdout.write(display + "\n");
  }

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
