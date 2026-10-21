import type { Integration } from "./types";

/**
 * Integration pages. Three steps, one config block, five tools out of the 17.
 * Commands are the ones documented in causal-memory/README.md; nothing here
 * assumes a package that does not exist.
 */

const UPDATED_AT = "2026-10-21";

const TOP_TOOLS = [
  {
    name: "search_causal",
    what: "Rank past decisions and outcomes for the task in front of you. Call it before a non-trivial change.",
  },
  {
    name: "record_decision",
    what: "Write the decision, the context and the observed outcome as one typed edge. Call it after the outcome exists.",
  },
  {
    name: "intervention_query",
    what: "Forward-check an action you are about to take and get the chains it would trigger, including DANGER chains.",
  },
  {
    name: "trace_cause",
    what: "Walk backwards from a bad outcome to the decision that caused it. Use it for postmortems.",
  },
  {
    name: "counterfactual_query",
    what: "Compare a decision with the alternative you rejected, using recorded evidence rather than recollection.",
  },
];

export const integrations: Integration[] = [
  {
    slug: "claude-code",
    name: "Claude Code",
    title: "causal-memory with Claude Code",
    seoTitle: "Claude Code + causal-memory MCP setup",
    description:
      "Add causal memory to Claude Code in three steps: install the server, register it over MCP, and install the skill that teaches the agent when to record and recall.",
    tagline:
      "Claude Code already reads your repository. Give it the one thing a repository cannot store: why a decision was made, and what it prevented.",
    prerequisite:
      "Claude Code with MCP support, and the causal-memory binary available on your PATH. The easiest install is pip; a source build works too.",
    steps: [
      {
        title: "Install the server",
        body: "The Python package puts the same causal-memory console script on your PATH; running it with no arguments starts the stdio MCP server. If you prefer a source build, build the release binary and use its path instead.",
        code: "pip install causal-memory",
      },
      {
        title: "Register it with Claude Code",
        body: "Add the server to the project's .mcp.json so the registration travels with the repository, or register it once for your user. The command and the JSON below are equivalent — pick one.",
        code: "claude mcp add causal-memory -- causal-memory",
      },
      {
        title: "Teach the agent when to use it",
        body: "The tools work as soon as the server is registered, but agents do not call memory proactively without instruction. Install the bundled skill, which tells the agent when to record a decision and when to recall before acting.",
        code: "npx skills add JingxuanC/causal-memory@causal-memory",
      },
      {
        title: "Verify",
        body: "Ask Claude Code to run a causal search. An empty result is the correct first answer; the point is that the tool call succeeds and the store path is writable.",
        code: "search_causal with no query returns the most recent edges, or an empty list on a fresh store.",
      },
    ],
    config: {
      title: ".mcp.json in the repository root",
      language: "json",
      code: `{
  "mcpServers": {
    "causal-memory": {
      "command": "causal-memory",
      "env": {
        "CAUSAL_MEMORY_DB": "~/.local/share/causal-memory/causal.db"
      }
    }
  }
}`,
    },
    tools: TOP_TOOLS,
    notes: [
      "The server speaks stdio by default; there is no port to open and no service to keep running.",
      "CAUSAL_MEMORY_DB selects the SQLite file. Point different repositories at different files if you want separate memory.",
      "The bundled skill is the difference between a mounted tool and a used one — install it before judging the results.",
      "Everything stays local unless you configure HTTP embeddings or point the client at the hosted endpoint.",
    ],
    faq: [
      {
        q: "Do I need a Rust toolchain?",
        a: "No. pip install causal-memory ships the same CLI and stdio server. A source build is only necessary if you want a specific commit or a feature flag such as local ONNX embeddings.",
      },
      {
        q: "Where is the memory stored?",
        a: "In the SQLite file named by CAUSAL_MEMORY_DB, by default ~/.local/share/causal-memory/causal.db. It is a normal SQLite database, so you can inspect it with the sqlite3 CLI.",
      },
      {
        q: "Why is the first search empty?",
        a: "A new store has no edges. Memory only becomes useful after record_decision has been called a few times; the skill exists to make the agent do that without being asked each session.",
      },
      {
        q: "Can I share one memory across a team?",
        a: "Locally, the file can be shared like any other file, but there is no locking story for concurrent writers. For teams, run the HTTP transport with a token file, which keeps one database per tenant.",
      },
      {
        q: "Does this change how Claude Code edits files?",
        a: "No. It adds tools the agent can call. The only behavioural change comes from the skill, which asks the agent to recall before a non-trivial change and record the outcome after.",
      },
    ],
    related: [
      "/use-cases/coding-agent",
      "/use-cases/on-call-agent",
      "/integrations/cursor",
      "/integrations/dsh",
      "/vs/mem0",
    ],
    updatedAt: UPDATED_AT,
  },
  {
    slug: "cursor",
    name: "Cursor",
    title: "causal-memory with Cursor",
    seoTitle: "Cursor + causal-memory MCP setup",
    description:
      "Wire causal-memory into Cursor as an MCP server: install the binary, add it to ~/.cursor/mcp.json, restart, and install the skill so the agent actually uses it.",
    tagline:
      "The same repository, the same compaction problem. Cursor gets a causal record that survives the context window.",
    prerequisite:
      "Cursor with MCP enabled, and the causal-memory server on your PATH (pip install causal-memory, or a release binary).",
    steps: [
      {
        title: "Install the server",
        body: "Install the CLI so the command resolves on PATH. Cursor launches MCP servers with your shell environment, so a binary in ~/.local/bin or /usr/local/bin is enough.",
        code: "pip install causal-memory",
      },
      {
        title: "Add the MCP server",
        body: "Create or edit ~/.cursor/mcp.json for a user-wide registration, or .cursor/mcp.json inside the repository to scope memory to that project. Restart Cursor after saving.",
        code: "cursor → Settings → MCP → add a server, or edit the JSON directly",
      },
      {
        title: "Install the skill",
        body: "Cursor reads agent skills; the same skill that works with Claude Code works here. Without it the tools are available but rarely called.",
        code: "npx skills add JingxuanC/causal-memory@causal-memory",
      },
      {
        title: "Verify",
        body: "Open a chat, ask for a causal search, and confirm the tool call appears in the MCP panel. A fresh store returns an empty list — that is a successful call, not a failure.",
      },
    ],
    config: {
      title: "~/.cursor/mcp.json (or .cursor/mcp.json in the repo)",
      language: "json",
      code: `{
  "mcpServers": {
    "causal-memory": {
      "command": "causal-memory",
      "args": [],
      "env": {
        "CAUSAL_MEMORY_DB": "~/.local/share/causal-memory/causal.db"
      }
    }
  }
}`,
    },
    tools: TOP_TOOLS,
    notes: [
      "A repository-scoped .cursor/mcp.json keeps a client project's memory separate from your other work.",
      "If the server does not appear, check that the command resolves from a non-login shell — Cursor may not load your full profile.",
      "Multiple Cursor windows share the same SQLite file unless you override CAUSAL_MEMORY_DB.",
      "The HTTP transport is available if you would rather run one server for several clients.",
    ],
    faq: [
      {
        q: "Does Cursor support MCP servers?",
        a: "Yes. Cursor reads mcpServers from ~/.cursor/mcp.json or a project-level .cursor/mcp.json, which is the same shape used by Claude Code and most MCP clients.",
      },
      {
        q: "Why does the server not start?",
        a: "The usual cause is PATH: a GUI-launched editor may not see a shell alias or a virtualenv-only install. Use an absolute path in the command field, or install the binary somewhere on the system PATH.",
      },
      {
        q: "Can I use the hosted endpoint instead of a local file?",
        a: "Yes, if you have a cloud memory token. Point the client at the hosted MCP endpoint with the token in the environment instead of launching a local command. The tool surface is the same 17 tools.",
      },
      {
        q: "Will Cursor call the tools on its own?",
        a: "Sometimes, but not reliably. The skill exists because proactive memory use is a behaviour, not a capability; install it and the agent gets explicit instructions for when to recall and when to record.",
      },
      {
        q: "Does this work with Cursor's agent mode?",
        a: "Yes. MCP tools are available to the agent in chat and in agent mode; the difference is that agent mode can chain a recall, an edit and a record in one turn.",
      },
    ],
    related: [
      "/use-cases/coding-agent",
      "/use-cases/trading-agent",
      "/integrations/claude-code",
      "/integrations/dsh",
      "/vs/letta",
    ],
    updatedAt: UPDATED_AT,
  },
  {
    slug: "dsh",
    name: "DeepSeek Harness",
    title: "causal-memory with DeepSeek Harness",
    seoTitle: "DSH + causal-memory plugin setup",
    description:
      "Install the causal-memory DSH plugin: 17 memory tools with clean names, a system-prompt section that teaches recall, and a local SQLite store. Three steps, no config file editing.",
    tagline:
      "A native plugin rather than an MCP bridge: 17 tools with clean names, plus a system-prompt section that makes the agent check memory before it acts.",
    prerequisite:
      "DSH Desktop 0.2.0-rc.2 or newer, a causal-memory binary on PATH (pip install causal-memory is enough), and the plugin package available locally or from the registry.",
    steps: [
      {
        title: "Install the memory binary",
        body: "The plugin resolves the server binary in a fixed order: an explicit config.command, then CAUSAL_MEMORY_BIN, then the repository's target/release build, then the bare causal-memory name on PATH. pip is the shortest path.",
        code: "pip install causal-memory",
      },
      {
        title: "Add the plugin to the profile",
        body: "Install the plugin into a DSH profile. Installed as a link, edits to the plugin take effect without reinstalling; the bundle manifest is merged automatically.",
        code: 'dsh plugin --profile web add "$PWD/dsh-plugin"',
      },
      {
        title: "Restart and verify",
        body: "Restart DSH so the plugin loads. You should see the 17 tools without an mcp__ prefix, and the injected system-prompt section should make the agent recall before a non-trivial task.",
        code: "Settings → Causal Memory → Test connection",
      },
    ],
    config: {
      title: "Optional plugin configuration",
      language: "json",
      code: `{
  "command": "causal-memory",
  "dbPath": "~/.local/share/causal-memory/causal.db",
  "toolCallTimeoutMs": 60000,
  "failOnStartupError": true
}`,
    },
    tools: [
      {
        name: "search_causal",
        what: "Recall past decisions for the current task. With the plugin, this name has no mcp__ prefix.",
      },
      {
        name: "record_decision",
        what: "Write decision, context and outcome as one edge. The plugin's system prompt asks for this after an outcome is observed.",
      },
      {
        name: "intervention_query",
        what: "Forward-check an action before it happens; a prevented outcome returns a DANGER chain.",
      },
      {
        name: "trace_cause",
        what: "Attribute a bad outcome to the decision behind it.",
      },
      {
        name: "counterfactual_query",
        what: "Compare what a decision produced with the alternative that was rejected.",
      },
    ],
    notes: [
      "The plugin injects a system-prompt section at order 300 — that is the mechanism that makes recall proactive rather than accidental.",
      "failOnStartupError defaults to true: if the binary cannot be found, activation fails loudly with an install hint instead of silently mounting nothing.",
      "The exclude option removes individual tools if a profile needs a narrower surface.",
      "grok-build, Hermes and plain MCP clients are supported through the same store; the DSH plugin is the tightest integration, not the only one.",
    ],
    faq: [
      {
        q: "Is this an MCP bridge or a native plugin?",
        a: "Native. The plugin mounts the engine's tools directly onto the harness tool surface with clean names, and injects a system-prompt section. The underlying store and semantics are the same as the MCP server.",
      },
      {
        q: "What happens if the binary is missing?",
        a: "With failOnStartupError at its default (true), plugin activation fails with an install hint. Set it to false only if you want the profile to start without memory and accept that no tools will be available.",
      },
      {
        q: "Can I use the hosted memory instead of a local binary?",
        a: "Yes. The cloud memory plugin (dsh-causal-memory, installed from the same plugin page) points at the hosted endpoint with an API key. The local plugin is the offline-first option and keeps the database on your machine.",
      },
      {
        q: "Where is the database?",
        a: "By default ~/.local/share/causal-memory/causal.db, or whatever dbPath is configured. The path is the same one the CLI and MCP server use, so all three share one graph.",
      },
      {
        q: "Does the plugin change other DSH behaviour?",
        a: "No. It adds tools and one system-prompt section. If the section is not what you want, exclude the tools you do not need, or use the plain MCP server in a profile that does not load the plugin.",
      },
    ],
    related: [
      "/use-cases/on-call-agent",
      "/use-cases/trading-agent",
      "/integrations/claude-code",
      "/integrations/cursor",
      "/vs/zep",
    ],
    updatedAt: UPDATED_AT,
  },
];

export const integrationBySlug = new Map(integrations.map((i) => [i.slug, i]));
