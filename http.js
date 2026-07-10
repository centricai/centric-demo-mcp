/**
 * Centric Demo MCP — HTTP entry point (Cloud Run / public registry).
 *
 * Serves the Streamable HTTP transport on POST /mcp. Stateless: a fresh server
 * and transport are built per request, so there's no cross-request session state
 * to hijack — which suits a public, read-only demo. All tool logic lives in
 * tools.js (shared with the stdio entry point).
 *
 * GET /healthz is a plain liveness probe for Cloud Run.
 */
const express = require("express");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { buildServer } = require("./tools.js");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Liveness probe.
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", service: "centric-demo-mcp" });
});

// A friendly root so a human hitting the URL in a browser sees something sane.
app.get("/", (_req, res) => {
  res.status(200).json({
    service: "centric-demo-mcp",
    description: "Public demo MCP for Centric. Fictional data, RM-tier, no score.",
    endpoint: "/mcp",
  });
});

// MCP endpoint. Stateless request/response — new instance each call.
app.post("/mcp", async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Method-not-allowed for GET/DELETE on /mcp in stateless mode.
const methodNotAllowed = (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
};
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.error(`centric-demo MCP running (HTTP) on :${PORT} — POST /mcp`);
});
