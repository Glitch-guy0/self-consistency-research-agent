import chalk from "chalk";
import type { ITerminalPresenter } from "#src/interface/ITerminalPresenter.ts";

type ChalkFn = (s: string) => string;

export class ChalkPresenter implements ITerminalPresenter {
  render(text: string, opts?: { color?: string; bgcolor?: string; opacity?: number }): string {
    let result: string = text;

    if (opts?.color) {
      const colorFn = (chalk as never)[opts.color] as ChalkFn | undefined;
      if (colorFn) {
        result = colorFn(result);
      }
    }

    if (opts?.bgcolor) {
      const bgKey = "bg" + opts.bgcolor.charAt(0).toUpperCase() + opts.bgcolor.slice(1);
      const bgFn = (chalk as never)[bgKey] as ChalkFn | undefined;
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
