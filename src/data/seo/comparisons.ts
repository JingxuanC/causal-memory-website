import type { Comparison } from "./types";

/**
 * Head-to-head pages. The rule for this file: every claim about a competitor
 * is either a public product fact or a row from the differentiation table in
 * causal-memory/README.md. No invented competitor benchmarks.
 */

const UPDATED_AT = "2026-10-21";

export const comparisons: Comparison[] = [
  {
    slug: "mem0",
    name: "mem0",
    title: "causal-memory vs mem0",
    seoTitle: "causal-memory vs mem0: causal vs fact recall",
    description:
      "An honest mem0 comparison: mem0 leads fact recall (91.6% vs 79.1% on LoCoMo), causal-memory adds typed causal edges, inhibition and pre-action warnings. Where each one breaks.",
    tagline:
      "mem0 is the better fact store. causal-memory answers the next question: why did that decision work, and what did it prevent?",
    intro: [
      "mem0 is the reference implementation of the fact-memory layer: pull facts and preferences out of a conversation, deduplicate them, and return the ones closest to the current query. It is good at that job, and the benchmark table below says so before this page says anything else.",
      "causal-memory stores a different object. Alongside facts it keeps typed edges between a decision, the context it was made in, and what happened — caused, enabled, prevented, no_effect. Those edges live in one SQLite file that sits outside the agent's context window, so compaction cannot rewrite them.",
      "The difference only shows up at a specific moment: the agent is about to do something again. Fact recall answers 'what does the user prefer?'. Causal recall answers 'last time we skipped the migration lock, production login failed for 40 minutes, and adding the lock prevented it'. The second answer changes the next action; the first one decorates it.",
      "This page is deliberately structured so that the gaps come before the pitch. If your workload is fact recall, mem0 is the correct default and there is no reason to migrate.",
    ],
    features: [
      {
        label: "What gets stored",
        us: "Facts, temporal state and decision → outcome causal edges in one SQLite file",
        them: "Extracted facts, preferences and entities, retrieved by semantic similarity",
      },
      {
        label: "Causal edge types",
        us: "caused / enabled / prevented / no_effect, each with a fixed spread coefficient",
        them: "Memory relations are not typed as causal; there is no prevented edge",
      },
      {
        label: "Pre-action check",
        us: "intervention_query returns a ranked warning chain before the tool call happens",
        them: "Retrieval is query-driven; there is no forward-simulation entry point",
      },
      {
        label: "Inhibition",
        us: "prevented spreads −0.3, so a known-bad approach ranks below neutral instead of tying with it",
        them: "No negative activation; semantic similarity is the only ranking signal",
      },
      {
        label: "Belief revision",
        us: "Soft superseded_by keeps the falsified edge readable for counterfactuals",
        them: "An update usually replaces or adds a fact; the old belief is not queryable as the loser of a comparison",
      },
      {
        label: "Compaction survival",
        us: "100% causal recall after 5x compaction — the table is outside the context window",
        them: "45% textual recall after 5x compaction in our harness",
      },
      {
        label: "Deployment shape",
        us: "One binary plus SQLite; stdio or HTTP MCP; no external service required",
        them: "SDK plus a vector store; a managed cloud platform is available",
      },
      {
        label: "Fact recall (LoCoMo, strict judge)",
        us: "79.1%",
        them: "91.6% — mem0's home turf",
      },
      {
        label: "Client surface",
        us: "Rust core, Python bindings, 17 MCP tools; TypeScript through any MCP client",
        them: "First-class Python and TypeScript SDKs with broad framework integrations",
      },
    ],
    honestGaps: [
      {
        label: "Fact recall — LoCoMo (strict judge)",
        us: "79.1%",
        them: "91.6%",
      },
      {
        label: "Fact recall — LongMemEval-S",
        us: "76.4% @ 11.5K tok/q",
        them: "94.4% official · 73.8% independent repro",
      },
      {
        label: "Lesson transfer — CausalEval C6",
        us: "20%",
        them: "30% (mem0, 70q protocol)",
      },
      {
        label: "SDK surface",
        us: "Rust core and Python bindings; TypeScript only through MCP",
        them: "Native Python and TypeScript SDKs",
      },
      {
        label: "Managed platform maturity",
        us: "Hosted memory is early; self-hosting is the documented path",
        them: "Managed cloud, dashboards and team features",
      },
      {
        label: "Community and integrations",
        us: "Small team, v0.10.0-alpha, Apache-2.0",
        them: "Larger ecosystem and more framework adapters",
      },
    ],
    chooseThem: [
      "Your memory is mostly user preferences, profile facts and entity lookups, and LoCoMo-style recall is the metric you report.",
      "You want native Python and TypeScript SDKs plus a managed service with team-facing controls.",
      "You already run a vector database and want memory to sit behind it rather than in a separate file.",
      "You are not recording decisions and outcomes, so there is nothing causal to store yet.",
    ],
    chooseUs: [
      "Your agent repeats the same mistake after every context compaction, and you can name the mistake.",
      "You need a pre-action warning on risky operations — a deploy, a destructive migration, a production write.",
      "You want the falsification trail: what was believed, when it was superseded, and what the old belief still explains.",
      "You want local-first memory in a single file, with no service to operate and no data leaving the machine.",
    ],
    verdict:
      "Use mem0 when the question is 'what is true about this user?'. Use causal-memory when the question is 'what happened last time we did this, and what stopped it from being worse?'. Running both is a legitimate answer: fact recall in mem0, decision edges in causal-memory, each queried for what it is actually good at.",
    faq: [
      {
        q: "Is causal-memory a drop-in replacement for mem0?",
        a: "No. The stored object is different. mem0 stores and retrieves facts; causal-memory stores facts plus typed decision → outcome edges. If you replace mem0 with causal-memory and keep asking fact-recall questions, you will get worse answers — 79.1% vs 91.6% on LoCoMo.",
      },
      {
        q: "Why is LoCoMo lower if causal memory is supposed to be better?",
        a: "Because LoCoMo measures atomic fact extraction and recall, which is exactly what mem0 optimises for. causal-memory's write path distils decisions and outcomes, so some fact detail is traded away. The capabilities causal-memory is built for — C2 intervention, C4 inhibition, C7 update — are not measured by LoCoMo at all.",
      },
      {
        q: "Can I run both at the same time?",
        a: "Yes, and that is the recommended migration path. Keep mem0 for facts, add causal-memory as an MCP server for decision edges. They do not share state, so neither can corrupt the other, and you can evaluate the causal side on real incidents before deciding whether it earns its place.",
      },
      {
        q: "Do I have to migrate existing mem0 memories?",
        a: "Facts can be re-recorded through record_fact, one of the 17 MCP tools. Causal edges cannot be migrated, because they have to come from real decisions and real outcomes — a fact export does not contain the reasoning that makes an edge useful. Start recording from today and let the graph grow.",
      },
      {
        q: "What does a prevented edge actually change?",
        a: "It spreads negative activation (−0.3). When the agent asks what would happen if it skipped the test suite, the outcome that was prevented by adding tests ranks below neutral instead of being silently filtered out or ranked alongside positive outcomes. That is the difference between 'I don't know' and 'that specifically goes wrong'.",
      },
    ],
    related: [
      "/use-cases/coding-agent",
      "/use-cases/on-call-agent",
      "/integrations/claude-code",
      "/integrations/cursor",
      "/vs/zep",
    ],
    updatedAt: UPDATED_AT,
  },
  {
    slug: "zep",
    name: "Zep",
    title: "causal-memory vs Zep",
    seoTitle: "causal-memory vs Zep: temporal vs causal",
    description:
      "Zep models how facts change over time with a temporal knowledge graph. causal-memory models how decisions cause outcomes, including prevented ones. An honest comparison of scope, ops and limits.",
    tagline:
      "Zep models how facts change over time. causal-memory models how decisions cause outcomes — including the outcomes they prevented.",
    intro: [
      "Zep approaches memory from the temporal side. Its Graphiti engine keeps entities and relationships in a knowledge graph where edges carry validity windows, so the system can answer 'what was true in March?' instead of flattening every fact into one undated blob. That is a real problem, solved properly, and it is a different problem from the one this project attacks.",
      "causal-memory also stores temporal validity on edges — C5 temporal-causal is 90% on CausalEval — but the unit it is built around is the decision. A decision, the context it was made in, and its outcome become a typed edge. The graph then supports backward attribution, forward intervention simulation, and inhibitory spread for the approaches that made things worse.",
      "The distinction is easiest to see in a postmortem. A temporal graph can tell you which service configuration was valid at 02:14. A causal graph can tell you that the configuration was changed because the previous one caused a timeout, and that the rollback is what prevented a full outage. Both are useful; only one of them warns you before the next deploy.",
      "Zep is a service with a graph database behind it. causal-memory is a single binary over SQLite. That difference in operational weight matters more than any feature row for a small team.",
      "One number belongs on every comparison page even when it is not about the competitor: on fact recall causal-memory trails mem0, 79.1% against 91.6% on LoCoMo with a strict judge. Zep has not been measured on that suite by us, and this page does not guess a score for it.",
    ],
    features: [
      {
        label: "Unit of memory",
        us: "Decision → context → outcome causal edges, plus facts and temporal state",
        them: "Entities and relationships in a temporal knowledge graph (Graphiti)",
      },
      {
        label: "Time model",
        us: "valid_from / valid_to on edges; temporal-causal ordering scores 90% on CausalEval",
        them: "Bi-temporal edge invalidation is the core of the product and is more mature than ours",
      },
      {
        label: "Causal semantics",
        us: "Typed caused / enabled / prevented / no_effect with fixed spread coefficients",
        them: "Relationship types are general-purpose; there is no built-in inhibited or prevented semantics",
      },
      {
        label: "Pre-action check",
        us: "intervention_query returns a ranked forward chain before the action",
        them: "Graph retrieval answers questions about the stored past; no forward-simulation endpoint",
      },
      {
        label: "Inhibition",
        us: "prevented spreads −0.3 so failed approaches rank below neutral",
        them: "No negative activation coefficient; ranking is relevance-based",
      },
      {
        label: "Belief revision",
        us: "Soft superseded_by keeps the falsified edge readable for counterfactuals",
        them: "Edge invalidation preserves history, which suits facts that change over time",
      },
      {
        label: "Operational footprint",
        us: "One binary and one SQLite file; nothing else to run",
        them: "Graphiti service plus a graph database; a managed offering removes that burden",
      },
      {
        label: "Local-first",
        us: "Yes — offline by default, optional local ONNX embeddings",
        them: "Service-oriented architecture; cloud is the expected deployment",
      },
      {
        label: "CausalEval numbers",
        us: "C2 75%, C4 80%, C7 100% (140q protocol, v13)",
        them: "Zep was not run on CausalEval, so this page publishes no Zep score",
      },
      {
        label: "Fact recall (LoCoMo, strict judge)",
        us: "79.1%",
        them: "Not measured for Zep; mem0 leads at 91.6%",
      },
    ],
    honestGaps: [
      {
        label: "Temporal query maturity",
        us: "Validity windows exist, but bi-temporal invalidation is younger and less battle-tested",
        them: "Bi-temporal modelling is the product's core and its most mature surface",
      },
      {
        label: "Entity resolution at scale",
        us: "SimHash pattern separation plus graph traversal; not a dedicated ER pipeline",
        them: "Built for entity-heavy graphs with resolution as a first-class concern",
      },
      {
        label: "Managed service",
        us: "Hosted memory is early; self-hosting is the documented path",
        them: "Managed cloud with the graph operations handled for you",
      },
      {
        label: "Graph tooling and ecosystem",
        us: "No graph UI; inspect through MCP tool output and SQLite",
        them: "A graph engine ecosystem with its own tooling",
      },
      {
        label: "Benchmark coverage",
        us: "No published head-to-head against Zep on CausalEval",
        them: "Also not measured by us — an absence of evidence on both sides",
      },
      {
        label: "Distributed deployment",
        us: "Single-node SQLite; multi-tenant HTTP runs one store per tenant",
        them: "Service architecture designed to be deployed and scaled as infrastructure",
      },
    ],
    chooseThem: [
      "Your hardest questions are temporal: what was true at a given time, and which fact invalidated which.",
      "You want a managed graph service and do not want to run stateful infrastructure yourself.",
      "Your domain is entity-heavy — customers, accounts, contracts — with relationships that change independently of decisions.",
      "You need a graph database behind memory for existing analytics or tooling.",
    ],
    chooseUs: [
      "Your agents make operational decisions whose outcomes you need to compare later.",
      "You need to know what prevented an incident, not only what happened during it.",
      "You want a pre-action warning before a risky command, not a post-hoc query.",
      "You want local-first memory with no graph database to operate.",
    ],
    verdict:
      "Zep is the stronger choice for temporal fact graphs and for teams that want managed graph infrastructure. causal-memory is the stronger choice when the memory has to explain decisions and stop the agent from repeating a bad one. A team can reasonably use Zep for entity facts and causal-memory for the decision journal; they answer different questions and neither replaces the other.",
    faq: [
      {
        q: "Zep vs causal-memory in one sentence?",
        a: "Zep remembers what was true and when; causal-memory remembers what was decided, what happened, and what prevented a worse outcome. Temporal graph versus causal graph.",
      },
      {
        q: "Does causal-memory have temporal validity?",
        a: "Yes. Edges carry valid_from and valid_to, and temporal-causal ordering is one of the CausalEval classes (C5, 90%). It is not as mature as Zep's bi-temporal model, and the comparison table says so rather than hiding it.",
      },
      {
        q: "Can I use both?",
        a: "Yes. Entity facts belong in a temporal graph; decision edges belong in causal-memory. The two stores do not share state, so there is no consistency problem to solve — only two queries to route.",
      },
      {
        q: "Why are there no Zep numbers on this page?",
        a: "Because we did not run Zep on CausalEval. The published baseline is mem0 on the 70-question protocol. Inventing a competitor score would make every other number on this site untrustworthy, so the cell says 'not measured' instead.",
      },
      {
        q: "Which one is easier to self-host?",
        a: "causal-memory: one binary and one SQLite file, started over stdio or HTTP. Zep's graph architecture expects a service and a graph database, which is a reasonable cost if you need what that architecture provides.",
      },
    ],
    related: [
      "/use-cases/on-call-agent",
      "/use-cases/trading-agent",
      "/integrations/claude-code",
      "/integrations/dsh",
      "/vs/letta",
    ],
    updatedAt: UPDATED_AT,
  },
  {
    slug: "letta",
    name: "Letta",
    title: "causal-memory vs Letta",
    seoTitle: "causal-memory vs Letta: memory vs runtime",
    description:
      "Letta is a stateful agent runtime with editable memory blocks. causal-memory is a memory layer any runtime can mount over MCP. Different layers, honest comparison of scope and limits.",
    tagline:
      "Letta gives the agent a runtime and editable memory blocks. causal-memory gives any runtime a causal record of decisions and their outcomes.",
    intro: [
      "Letta — the project that grew out of MemGPT — is an agent runtime. It runs the loop, manages context, gives the agent core memory blocks it can edit, and ships a server plus a desktop environment for inspecting agent state. The memory is part of a complete system, which is why the comparison is not really feature-for-feature.",
      "causal-memory is a memory layer. It does not run an agent loop and does not want to. It exposes 17 MCP tools over a SQLite store, so Claude Code, Cursor, DSH or a custom runtime can record a decision and query it later. You keep your runtime; you add a causal record to it.",
      "That makes the two products complementary far more often than competitive. If you are choosing a runtime, Letta is a candidate. If you already have a runtime and need it to remember why a decision worked, causal-memory is the smaller, more targeted addition.",
      "The one place they genuinely overlap is the write path: both expect the agent to decide what is worth remembering. Letta does it by letting the agent edit memory blocks. causal-memory does it through explicit record_decision and record_fact calls, with a bundled skill that teaches the agent when to call them.",
    ],
    features: [
      {
        label: "Product category",
        us: "Memory layer over MCP; bring your own agent loop",
        them: "Stateful agent runtime with memory, server and desktop environment",
      },
      {
        label: "Memory model",
        us: "Facts plus a typed causal graph in one SQLite file",
        them: "Core memory blocks the agent edits, plus archival and recall memory",
      },
      {
        label: "Causal semantics",
        us: "caused / enabled / prevented / no_effect, each with a spread coefficient",
        them: "Block contents are prose; there are no typed causal or inhibitory edges",
      },
      {
        label: "Learning from failure",
        us: "prevented edges spread negative activation and feed intervention_query",
        them: "The agent can write a lesson into a block; there is no ranking semantics for 'this prevented that'",
      },
      {
        label: "Memory inspection",
        us: "MCP tool output and the SQLite file; no UI",
        them: "A desktop environment for inspecting and editing agent memory",
      },
      {
        label: "Runtime lock-in",
        us: "None — any MCP client, or the HTTP transport",
        them: "Memory lives inside the Letta runtime and its server",
      },
      {
        label: "Operational footprint",
        us: "One binary and one SQLite file",
        them: "Agent server plus a database; Docker compose is provided",
      },
      {
        label: "Compaction survival",
        us: "100% causal recall at 5x compaction, measured",
        them: "Context management is a first-class design concern; we have not run Letta on our compaction harness",
      },
      {
        label: "CausalEval numbers",
        us: "C7 100%, C3 95%, C2 75%, C4 80% (140q, v13)",
        them: "Letta was not run on CausalEval, so this page publishes no Letta score",
      },
    ],
    honestGaps: [
      {
        label: "Agent runtime",
        us: "We are not one. You keep your loop and your orchestration",
        them: "A complete stateful agent runtime, server and desktop environment",
      },
      {
        label: "Self-editing memory",
        us: "Writes are explicit tool calls; a bundled skill teaches the agent when to make them",
        them: "The agent edits its own memory blocks as part of the loop",
      },
      {
        label: "Tooling and UI",
        us: "No dashboard; inspect through MCP output or SQLite",
        them: "Agent Development Environment for inspecting and editing memory",
      },
      {
        label: "Managed hosting",
        us: "Hosted memory is early; self-hosting is the documented path",
        them: "A cloud offering for teams that do not want to run the server",
      },
      {
        label: "Community and maturity",
        us: "Small team, v0.10.0-alpha, Apache-2.0",
        them: "A larger project with more integrations and examples",
      },
      {
        label: "Fact recall",
        us: "79.1% on LoCoMo (strict judge)",
        them: "Not measured by us; mem0 leads this suite at 91.6%",
      },
    ],
    chooseThem: [
      "You have not chosen an agent runtime yet and want memory, context management and a UI in one system.",
      "You want the agent to edit its own memory blocks without an external memory service.",
      "You want a desktop environment for inspecting what an agent remembers.",
      "You are building on the MemGPT architecture and want its descendants.",
    ],
    chooseUs: [
      "You already run Claude Code, Cursor, DSH or a custom loop and do not want to migrate it.",
      "You need typed causal edges and a pre-action warning, not prose blocks.",
      "You want memory as a swappable MCP server with no runtime lock-in.",
      "You want local-first storage in one file that a human can inspect with sqlite3.",
    ],
    verdict:
      "This is mostly a layer question, not a winner question. Pick Letta if you need a runtime; add causal-memory if you need a causal record inside the runtime you already have. Teams that want both can mount causal-memory into a Letta agent over MCP and keep the causal graph outside the context window.",
    faq: [
      {
        q: "Is causal-memory a Letta alternative?",
        a: "No. Letta is a runtime; causal-memory is a memory layer. They compete only if you treat 'memory' as the whole product. If you need an agent loop, Letta provides one and causal-memory does not.",
      },
      {
        q: "Can a Letta agent use causal-memory?",
        a: "If the runtime can mount MCP servers, yes. causal-memory exposes stdio and HTTP MCP transports, so it sits beside the runtime rather than inside it. The causal table stays in its own SQLite file.",
      },
      {
        q: "Letta already has memory blocks. Why add causal edges?",
        a: "Blocks hold prose the agent wrote. Edges are queryable, ranked and typed: a prevented edge lowers the rank of an approach that failed, and intervention_query can return a forward chain before the agent acts. Prose can record a lesson; it cannot rank one against another at retrieval time.",
      },
      {
        q: "Which one puts less into the context window?",
        a: "causal-memory returns a small ranked chain instead of whole blocks, so the per-turn token cost is usually lower. The trade-off is that the agent must call a tool instead of reading memory that is always present.",
      },
      {
        q: "Do you publish Letta benchmark numbers?",
        a: "No. Letta was not run on CausalEval or on our compaction harness, and we do not publish scores for systems we did not measure. The comparison above is about scope and design, not about a head-to-head score.",
      },
    ],
    related: [
      "/use-cases/coding-agent",
      "/use-cases/trading-agent",
      "/integrations/cursor",
      "/integrations/dsh",
      "/compare",
    ],
    updatedAt: UPDATED_AT,
  },
];

export const comparisonBySlug = new Map(comparisons.map((c) => [c.slug, c]));
