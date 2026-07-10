# Centric Demo MCP

A public, registry-safe MCP server that lets a prospect — or an AI agent crawling
the MCP registry — feel the Centric RM experience against a frozen fictional cast.
This is a **marketing asset**, not the product. The real customer server stays
private behind OAuth.

## What it exposes (RM tier only)

- `list_demo_contacts` — the fictional book of business
- `get_contact_profile` — five dimensions as Red/Yellow/Green, Brief Me, cadence note
- `brief_me` — the hero tool: synthesized pre-interaction brief
- `draft_as` — Draft As in email / text / linkedin / talking_points
- `get_radar` — radar shape, five axes as R/Y/G + normalized position
- `demo_temperature_check` — the temperature-check loop, acknowledged not saved

## What it deliberately does NOT expose (the moat)

Enforced by absence, not by feature flags:

- **No numeric Relational IP score.** No response object contains a score field.
  `get_radar` returns normalized positions for rendering only.
- **No divergence** — no perception-vs-measurement, no Annika/Keenan cast.
- **No manager tools** — no digest, book-of-business rollup, or coaching.
- **No cross-RM or cross-contact aggregation.**
- **No scoring methodology, weights, or cross-dimension logic.**
- **No write path.** Nothing persists.
- **No database credentials.** Reads `demo-fixture.json` only. Physically cannot
  return a real contact.

## The cast

Matches the marketing mockups so a prospect who sees a screenshot and then
connects the MCP lands on the same people. Demo RM is Marcus Johnson.
Hero contact is Isabella Chen (SVP Partnerships, Meridian Group).

## File layout

- `tools.js` — the six tools, single source of truth (shared by both transports)
- `http.js` — HTTP entry point (Cloud Run / public). `POST /mcp`. **Default.**
- `server.js` — stdio entry point (local testing / Claude Desktop)
- `demo-fixture.json` — the frozen fictional cast. Only data the image carries.
- `Dockerfile` — slim node base, prod deps only, non-root

## Run locally

```
npm install
npm start            # HTTP on :8080, POST /mcp
npm run start:stdio  # stdio, for Claude Desktop
```

## Connect via Claude Desktop (stdio, for testing)

```json
{
  "mcpServers": {
    "centric-demo": {
      "command": "node",
      "args": ["/absolute/path/to/centric-demo-mcp/server.js"]
    }
  }
}
```

## Deploy to Cloud Run (separate service — never the prod backend)

```
gcloud run deploy centric-demo-mcp \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --port 8080
```

`--allow-unauthenticated` is correct here: this endpoint is *meant* to be public.
It carries no secrets and no database credentials, so there is nothing to protect.
Map it to its own subdomain (e.g. `demo-mcp.getcentric.ai`) for the registry.

## Going public

Once the URL is live, publish to the official MCP Registry and claim the crawled
directory copies (Smithery, Glama, mcp.so). This server has nothing behind it, so
it is safe under adversarial probing: the worst outcome is someone reads a
fictional brief about Isabella Chen.
