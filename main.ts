import "dotenv/config";
import { config } from "#lib/utils/config.util.ts";
import { kvCache } from "#lib/utils/kvCache.util.ts";
import { SessionAdapter } from "#lib/session/sessionAdapter.provider.ts";
import { TUIManager } from "#lib/tui/tuiManager.ts";
import { Orchestrator } from "#lib/agent/orchestrator.ts";

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
