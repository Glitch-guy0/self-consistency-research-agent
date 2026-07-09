import "dotenv/config";
import { config } from "#src/utils/config.ts";
import { kvCache } from "#src/utils/kvCache.ts";
import { SessionAdapter } from "#src/service/SessionAdapter.ts";
import { TUIManager } from "#src/plugins/TUIManager.ts";
import { ChalkPresenter } from "#src/plugins/ChalkPresenter.ts";
import { Orchestrator } from "#src/modules/Orchestrator.ts";

async function main(): Promise<void> {
  const presenter = new ChalkPresenter();
  const tui = new TUIManager(presenter);
  const session = new SessionAdapter(kvCache);
  const orchestrator = new Orchestrator(tui, session, kvCache);

  while (true) {
    await orchestrator.run();
    tui.output("");
  }
}

void main().catch((err: unknown) => {
  console.error("Fatal startup error:", err);
});
