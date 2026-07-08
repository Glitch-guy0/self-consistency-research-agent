import "dotenv/config";

async function main(): Promise<void> {
  // TODO: Story 4.3 — instantiates Orchestrator and runs the query pipeline
  // TODO: Story 1.2 — loads typed config from environment
  console.log("Self-Consistency Research Agent");
}

void main().catch((err: unknown) => {
  console.error("Fatal startup error:", err);
});
