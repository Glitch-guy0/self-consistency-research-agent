import "dotenv/config";
import { config } from "#src/utils/config.ts";
import { kvCache } from "#src/utils/kvCache.ts";
import { SessionAdapter } from "#src/service/SessionAdapter.ts";
import { TUIManager } from "#src/plugins/TUIManager.ts";
import { Orchestrator } from "#src/modules/Orchestrator.ts";

async function main(): Promise<void> {
  void config;

  const tui = new TUIManager();
  const session = new SessionAdapter(kvCache);
  const orchestrator = new Orchestrator(tui, session, kvCache);

  await orchestrator.run();
}

void main().catch((err: unknown) => {
  console.error("Fatal startup error:", err);
});
