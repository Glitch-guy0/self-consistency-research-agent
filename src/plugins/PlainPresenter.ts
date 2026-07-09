import type { ITerminalPresenter } from "#src/interface/ITerminalPresenter.ts";

export class PlainPresenter implements ITerminalPresenter {
  render(text: string, _opts?: { color?: string; bgcolor?: string; opacity?: number }): string {
    return text;
  }

  success(text: string): string {
    return text;
  }

  fail(text: string): string {
    return text;
  }

  warning(text: string): string {
    return text;
  }
}
