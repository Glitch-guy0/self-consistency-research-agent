import "dotenv/config";
import { config } from "#lib/utils/config.util.ts";

async function main(): Promise<void> {
  // config is loaded eagerly on import — warnings fire here if vars are missing
  void config;
  // TODO: Story 4.3 — instantiates Orchestrator and runs the query pipeline
  console.log("Self-Consistency Research Agent");
}

void main().catch((err: unknown) => {
  console.error("Fatal startup error:", err);
});
