# Centric Demo MCP

Try Centric's relationship intelligence from any MCP-compatible AI assistant — Claude, ChatGPT, Cursor, and others. This demo server runs against a sample book of business with fictional contacts, so you can experience the product with no signup and no real data.

Centric is a relationship intelligence platform for people-facing professionals — relationship managers, client leads, and the teams who support them. It reads the state of a relationship and tells you what matters before your next interaction.

## What you can try

Connect the server and ask your assistant to:

- **List the sample contacts** — a demo book of business to explore.
- **Get a contact's relationship health** — five dimensions (Clarity, Cadence, Responsiveness, Bench Strength, Meaningful Moments), each shown as Red / Yellow / Green.
- **Brief me on a contact** — a synthesized read before you reach out: what to open with, what to be aware of.
- **Draft outreach** — email, text, LinkedIn, or talking points, grounded in the contact's context.
- **See the relationship radar** — the five dimensions at a glance.
- **Run a temperature check** — the quick "how did that interaction feel?" loop.

Everything here runs on fictional data. The hero contact is Isabella Chen (SVP Partnerships, Meridian Group); the demo relationship manager is Marcus Johnson.

## Connect

This is a remote server — there's nothing to install. Point your MCP client at:

```
https://centric-demo-mcp-808053805730.us-central1.run.app/mcp
```

Most assistants let you add a remote MCP server in their settings. If your client needs a config entry, use:

```json
{
  "mcpServers": {
    "centric-demo": {
      "url": "https://centric-demo-mcp-808053805730.us-central1.run.app/mcp"
    }
  }
}
```

For clients that connect through the `mcp-remote` bridge instead:

```json
{
  "mcpServers": {
    "centric-demo": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://centric-demo-mcp-808053805730.us-central1.run.app/mcp"]
    }
  }
}
```

## The full product

This demo shows the individual experience against sample data. The full Centric platform connects to your team's real book of business, with organizational controls, privacy safeguards, and the manager and coaching tools that make it a system of record — not just a lookup.

Learn more at [getcentric.ai](https://getcentric.ai).

[![smithery badge](https://smithery.ai/badge/centricai/centric-demo)](https://smithery.ai/servers/centricai/centric-demo)
