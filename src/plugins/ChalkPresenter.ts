import chalk from "chalk";
import type { ITerminalPresenter } from "#src/interface/ITerminalPresenter.ts";

const colorFns: Record<string, (s: string) => string> = {
  black: chalk.black,
  red: chalk.red,
  green: chalk.green,
  yellow: chalk.yellow,
  blue: chalk.blue,
  magenta: chalk.magenta,
  cyan: chalk.cyan,
  white: chalk.white,
  gray: chalk.gray,
  grey: chalk.grey,
};

const bgColorFns: Record<string, (s: string) => string> = {
  black: chalk.bgBlack,
  red: chalk.bgRed,
  green: chalk.bgGreen,
  yellow: chalk.bgYellow,
  blue: chalk.bgBlue,
  magenta: chalk.bgMagenta,
  cyan: chalk.bgCyan,
  white: chalk.bgWhite,
  gray: chalk.bgGray,
  grey: chalk.bgGrey,
};

export class ChalkPresenter implements ITerminalPresenter {
  render(text: string, opts?: { color?: string; bgcolor?: string; opacity?: number }): string {
    let result: string = text;

    if (opts?.color) {
      const colorFn = colorFns[opts.color];
      if (colorFn) {
        result = colorFn(result);
      }
    }

    if (opts?.bgcolor) {
      const bgFn = bgColorFns[opts.bgcolor];
      if (bgFn) {
        result = bgFn(result);
      }
    }

    return result;
  }

  success(text: string): string {
    return this.render(text, { color: "green" });
  }

  fail(text: string): string {
    return this.render(text, { color: "red" });
  }

  warning(text: string): string {
    return this.render(text, { color: "yellow" });
  }
}
