/**
 * Centric Demo MCP — stdio entry point (local testing / Claude Desktop).
 * All tool logic lives in tools.js. This file only wires the stdio transport.
 */
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { buildServer } = require("./tools.js");

async function main() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("centric-demo MCP running (stdio). Fictional cast, RM-tier, no score.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
