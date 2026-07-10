/**
 * Centric Demo MCP — shared tool definitions.
 * Single source of truth. Both server.js (stdio) and http.js (HTTP) call
 * buildServer() so the two transports can never drift apart.
 *
 * Hard design guarantees — enforced by ABSENCE, not by flags:
 *   - No numeric RIPI score is ever constructed or returned. get_radar returns
 *     normalized axis positions only.
 *   - No divergence, no perception-vs-measurement, no coaching, no manager tools.
 *   - No write path. Nothing persists. demo_temperature_check acknowledges only.
 *   - No database credentials. Reads demo-fixture.json and nothing else.
 */

const fs = require("fs");
const path = require("path");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { z } = require("zod");

// ---- Load the frozen fixture once. Read-only. -------------------------------
const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(__dirname, "demo-fixture.json"), "utf8")
);
const CONTACTS = FIXTURE.contacts;
const DIMENSION_ORDER = FIXTURE.dimensionOrder;

function findContact(idOrName) {
  const q = String(idOrName || "").trim().toLowerCase();
  return (
    CONTACTS.find((c) => c.id.toLowerCase() === q) ||
    CONTACTS.find((c) => c.name.toLowerCase() === q) ||
    CONTACTS.find((c) => c.name.toLowerCase().includes(q)) ||
    null
  );
}

function notFound(contact) {
  return {
    content: [
      {
        type: "text",
        text: `No demo contact matches "${contact}". Call list_demo_contacts to see the cast.`,
      },
    ],
  };
}

// RM-facing profile. No score, no divergence, no manager fields.
function rmProfile(c) {
  return {
    id: c.id,
    name: c.name,
    title: c.title,
    company: c.company,
    health: c.health,
    healthLabel: c.healthLabel,
    lastTouchDays: c.lastTouchDays,
    dimensions: c.dimensions,
    briefMe: c.briefMe,
    cadenceNote: c.cadenceNote,
    openContext: c.openContext,
  };
}

const DRAFT_FORMATS = ["email", "text", "linkedin", "talking_points"];

function buildDraft(c, format) {
  const firstName = c.name.split(" ")[0];
  switch (format) {
    case "email":
      return `Subject: Following up — ${c.company}\n\nHi ${firstName},\n\nThanks again for the recent exchange. I know the ${c.company} team has a lot in motion right now, so I'll keep this specific: I'd like to make sure we're aligned on next steps and that I'm bringing you the details that actually matter to your decision.\n\nWould a short call this week work? I'll come prepared with specifics, not a general update.\n\nBest,\nMarcus`;
    case "text":
      return `Hi ${firstName} — quick one. Want to make sure I'm getting you what you need on our end. Got 15 min this week for a focused catch-up? I'll keep it specific.`;
    case "linkedin":
      return `Hi ${firstName}, good to be connected here. I know things are busy on your side at ${c.company} — I'd value a short conversation to make sure what we're doing lines up with what matters most to you right now. Open to a quick call this week?`;
    case "talking_points":
      return [
        `Open by acknowledging their situation — ${firstName} responds to being seen, not sold to.`,
        `Lead with specifics, not a general update.`,
        `Name the concrete next step and a clear success metric.`,
        `Close by confirming timing that respects their reorg/timeline sensitivity.`,
      ]
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n");
    default:
      return "";
  }
}

/**
 * Construct a fresh McpServer with all six tools registered.
 * Called per-connection by the HTTP transport, once by stdio.
 */
function buildServer() {
  const server = new McpServer({ name: "centric-demo", version: "1.0.0" });

  server.tool(
    "list_demo_contacts",
    "List the demo book of business — the fictional contacts Centric is tracking for demo RM Marcus Johnson. Returns name, title, company, R/Y/G health, and days since last touch. Start here.",
    {},
    async () => {
      const rows = CONTACTS.map((c) => ({
        id: c.id,
        name: c.name,
        title: c.title,
        company: c.company,
        health: c.health,
        healthLabel: c.healthLabel,
        lastTouchDays: c.lastTouchDays,
      }));
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }
  );

  server.tool(
    "get_contact_profile",
    "Get the full RM-facing profile for one demo contact: the five Relational IP dimensions as Red/Yellow/Green, a Brief Me summary, cadence note, and current context. No numeric score — RMs see status, not the number.",
    { contact: z.string().describe("Contact id or name, e.g. 'Isabella Chen'") },
    async ({ contact }) => {
      const c = findContact(contact);
      if (!c) return notFound(contact);
      return { content: [{ type: "text", text: JSON.stringify(rmProfile(c), null, 2) }] };
    }
  );

  server.tool(
    "brief_me",
    "The Brief Me hero tool. Returns a synthesized pre-interaction brief for a demo contact — personality read, what to open with, what to avoid — plus a cadence heads-up when the relationship is in a Watch state.",
    { contact: z.string().describe("Contact id or name, e.g. 'Isabella Chen'") },
    async ({ contact }) => {
      const c = findContact(contact);
      if (!c) return notFound(contact);
      const out = {
        contact: c.name,
        title: c.title,
        company: c.company,
        health: c.healthLabel,
        brief: c.briefMe,
        cadenceHeadsUp: c.cadenceNote,
      };
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    }
  );

  server.tool(
    "draft_as",
    "Draft outreach to a demo contact in a chosen format: email, text, linkedin, or talking_points. Demonstrates Centric's Draft As feature — the draft is grounded in the contact's brief context. Demo only; nothing is sent or logged.",
    {
      contact: z.string().describe("Contact id or name, e.g. 'Isabella Chen'"),
      format: z
        .enum(["email", "text", "linkedin", "talking_points"])
        .default("email")
        .describe("Draft format. Defaults to email."),
    },
    async ({ contact, format }) => {
      const c = findContact(contact);
      if (!c) return notFound(contact);
      const fmt = DRAFT_FORMATS.includes(format) ? format : "email";
      const out = {
        contact: c.name,
        format: fmt,
        draft: buildDraft(c, fmt),
        whyThisDraft:
          "Grounded in the contact's current health and Brief Me context. In the paid product this reasoning is surfaced under a collapsed 'Why this draft' section.",
      };
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    }
  );

  server.tool(
    "get_radar",
    "Get the Relational IP radar shape for a demo contact: five axes, each a Red/Yellow/Green status plus a normalized 0–1 position for rendering the widget. Intentionally returns no numeric score.",
    { contact: z.string().describe("Contact id or name, e.g. 'Isabella Chen'") },
    async ({ contact }) => {
      const c = findContact(contact);
      if (!c) return notFound(contact);
      const axes = DIMENSION_ORDER.map((dim) => ({
        dimension: dim,
        status: c.dimensions[dim],
        position: c.radarShape[dim],
      }));
      return { content: [{ type: "text", text: JSON.stringify({ contact: c.name, axes }, null, 2) }] };
    }
  );

  server.tool(
    "demo_temperature_check",
    "Walk through the temperature check interaction for a demo contact: shows the prompt and the Positive / Neutral / Concern options, and returns a canned acknowledgment. Demonstrates the loop without saving anything.",
    {
      contact: z.string().describe("Contact id or name, e.g. 'Isabella Chen'"),
      read: z
        .enum(["positive", "neutral", "concern"])
        .optional()
        .describe("Optional: the read to simulate. Omit to just see the prompt."),
    },
    async ({ contact, read }) => {
      const c = findContact(contact);
      if (!c) return notFound(contact);
      const prompt = {
        contact: c.name,
        question: "How did that interaction feel?",
        options: ["👍 Positive", "➖ Neutral", "👎 Concern"],
      };
      if (!read) return { content: [{ type: "text", text: JSON.stringify(prompt, null, 2) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...prompt,
                yourRead: read,
                acknowledged:
                  "Recorded (demo only — nothing is saved). In the paid product this feeds the contact's temperature history.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}

module.exports = { buildServer };
