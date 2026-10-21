import type { UseCase } from "./types";

/**
 * Use-case pages. Structure mirrors the plan: pain → how causal memory is used
 * (decision / context / outcome) → code → metrics you can watch → FAQ.
 *
 * Numbers are only ever the CausalEval / README figures. Example payloads use
 * qualitative outcomes so no snippet reads as a customer result.
 */

const UPDATED_AT = "2026-10-21";

export const useCases: UseCase[] = [
  {
    slug: "coding-agent",
    name: "Coding agent",
    title: "Causal memory for a coding agent",
    seoTitle: "Causal memory for coding agents",
    description:
      "How a coding agent uses causal memory: record the decision behind a change, recall it before editing, and get a warning before a risky command. Code samples and metrics to watch.",
    tagline:
      "A coding agent already remembers the diff. Causal memory makes it remember why the diff was wrong the first time.",
    persona:
      "For teams running a coding agent across many sessions in one repository, where context compaction is routine and the same mistake keeps coming back.",
    painPoints: [
      {
        label: "The diff survives, the reasoning does not",
        body: "After two or three context compactions the agent still knows what the code looks like, but not why the retry loop was rewritten, which approach was tried first, or what broke when it was tried. The repository is a record of what exists, not of what was rejected.",
      },
      {
        label: "The same bug gets fixed the same wrong way",
        body: "A new session starts clean, rediscovers the symptom, and reaches for the first plausible fix — the one that already failed last month. Nothing in the loop marks that approach as known-bad, so the agent has no reason to avoid it.",
      },
      {
        label: "Architecture debates restart from zero",
        body: "A choice about queueing, locking or caching was settled with evidence. Six sessions later the agent reopens it with no memory of the evidence, and a human has to re-argue the same trade-off.",
      },
      {
        label: "The risky command looks routine",
        body: "A force-push, a migration without a lock, a release during a freeze. The agent has done it before and it went fine — except the time it did not, and that incident is not stored anywhere the agent looks.",
      },
    ],
    approach: [
      {
        heading: "Record the decision, not the diff",
        body: "After a change is merged or reverted, record one edge: the decision, the context it was made in, the observed outcome, and the relation between them. The diff is already in git; what git cannot reconstruct is which alternative was considered and why it was rejected. Keep the payload short enough that an agent will actually call the tool.",
        bullets: [
          "relation: caused when the decision produced the outcome, enabled when it contributed, prevented when it stopped something worse.",
          "task_tag: route recall later — backend-performance, migration, release, debugging.",
          "context: language version, scale, constraints. Two decisions with the same task_tag and context become a comparable branch for counterfactual queries.",
        ],
      },
      {
        heading: "Recall before editing",
        body: "Before a non-trivial change, search by task_tag and a short description of the current problem. The result is a ranked list of past decisions with their outcomes, not a pile of similar text. Read the failures first: they are the part a normal context window loses earliest.",
        bullets: [
          "Use task_tag alone for a domain sweep, or add query text for a broader semantic match.",
          "Ask for detail_level l0 when you only need to know whether a lesson exists.",
          "Treat a returned edge as evidence to check, not an instruction to follow — the code may have moved on.",
        ],
      },
      {
        heading: "Warn before the risky command",
        body: "Intervention prediction is the difference between a memory and a guardrail. Before a destructive or hard-to-reverse action, ask what happened last time an action like this was taken. A prevented edge returns a DANGER chain instead of silence, because the outcome that was avoided is stored as a typed edge with negative activation.",
        bullets: [
          "Run it before force-push, --no-verify, schema migrations, and dependency major bumps.",
          "A DANGER chain is a stop-and-read signal, not an automatic block; the agent still decides.",
          "The chain cites the original decision, so the warning is auditable rather than a vibe.",
        ],
      },
      {
        heading: "Retire the belief when it is falsified",
        body: "When a lesson turns out to be wrong, supersede the edge instead of deleting it. The falsification reaches the answer model, and the old edge stays readable for counterfactual questions. This is the C7 capability: 100% on CausalEval v13, up from 50% in v12 when superseded edges were hidden instead of annotated.",
        bullets: [
          "Delete nothing: a wrong lesson is still the evidence that a choice was once reasonable.",
          "Supersession is what keeps the graph from becoming a museum of stale advice.",
        ],
      },
    ],
    metrics: [
      {
        label: "Repeat-mistake rate",
        value: "33% vs 67%",
        note: "Agent repeat-mistake on the trap-world benchmark: causal-memory vs the fact-store baseline. Track the same thing on your own repo by tagging reverted changes that re-apply an already-failed approach.",
      },
      {
        label: "Causal recall after compaction",
        value: "100% vs 45%",
        note: "At 5x context compaction in our harness. This is the metric that decides whether memory survives a long session at all.",
      },
      {
        label: "Belief revision accuracy",
        value: "100%",
        note: "CausalEval C7 after soft supersession was introduced (v12: 50%). Watch for stale advice resurfacing after a lesson is corrected.",
      },
      {
        label: "Decision coverage",
        value: "Track weekly",
        note: "Share of merged changes that have a recorded decision edge. Low coverage means the agent is not calling record_decision — install the skill so it knows when to.",
      },
      {
        label: "Time to first correct fix",
        value: "Track per repo",
        note: "We publish no customer number for this. Measure it from the first failing CI run to the commit that stays merged, and compare before and after adoption.",
      },
    ],
    code: [
      {
        title: "1 · Record why the change was made, after it lands",
        language: "json",
        code: `{
  "name": "record_decision",
  "arguments": {
    "decision": "replaced the unbounded retry loop with a bounded queue",
    "outcome": "replay stopped dropping events; retries no longer amplify load",
    "relation": "caused",
    "task_tag": "backend-performance",
    "context": "Go 1.22, 4 workers, replay of the ingest backlog"
  }
}`,
      },
      {
        title: "2 · Recall before starting a similar change",
        language: "json",
        code: `{
  "name": "search_causal",
  "arguments": {
    "task_tag": "backend-performance",
    "query": "retry amplification under replay",
    "limit": 5,
    "detail_level": "l1"
  }
}`,
      },
      {
        title: "3 · Warn before the command that already went wrong once",
        language: "json",
        code: `{
  "name": "intervention_query",
  "arguments": {
    "action": "push directly to main with --no-verify",
    "task_tag": "release",
    "max_depth": 3
  }
}`,
      },
    ],
    faq: [
      {
        q: "Do I need to change my coding agent to use this?",
        a: "No. causal-memory is an MCP server, so it mounts into Claude Code, Cursor, DSH or any MCP client. The write discipline is the only new behaviour: the agent has to call record_decision after an outcome is observed, which is what the bundled skill teaches.",
      },
      {
        q: "Will it slow the agent down?",
        a: "Two extra tool calls per non-trivial change: one recall before, one record after. Both are local SQLite queries by default, so the latency is far below a model round trip. The intervention check is one more call and only on risky actions.",
      },
      {
        q: "What if the recorded lesson is wrong later?",
        a: "Supersede it rather than delete it. Soft supersession (C7) keeps the falsified edge readable for counterfactuals while making the correction visible to the answer model. A deleted lesson cannot explain why an old decision looked correct at the time.",
      },
      {
        q: "Does this replace code review or tests?",
        a: "No. It records the reasoning that review and tests cannot reconstruct: which alternative was rejected and what happened when it was tried. Tests tell you whether the code works; causal edges tell you why this approach and not the other one.",
      },
      {
        q: "Where does the data live?",
        a: "In one SQLite file (causal.db) on the machine running the server, or in a hosted tenant database if you use cloud memory. Nothing is sent anywhere unless you configure HTTP embeddings or the cloud endpoint.",
      },
    ],
    related: [
      "/use-cases/on-call-agent",
      "/use-cases/trading-agent",
      "/integrations/claude-code",
      "/integrations/cursor",
      "/vs/mem0",
      "/integrations/dsh",
    ],
    updatedAt: UPDATED_AT,
  },
  {
    slug: "on-call-agent",
    name: "On-call agent",
    title: "Causal memory for an on-call agent",
    seoTitle: "Causal memory for on-call agents",
    description:
      "On-call agents need the difference between what fixed an incident and what stopped it getting worse. Causal memory stores prevented edges, traces root cause, and warns before a repeat mitigation.",
    tagline:
      "An incident timeline records what happened. Causal memory records which mitigation actually prevented the worse outcome — and which one only looked like it did.",
    persona:
      "For teams using an agent to triage alerts, draft postmortems or suggest mitigations, where the same incident class returns every few weeks.",
    painPoints: [
      {
        label: "The timeline is not the lesson",
        body: "Postmortems list events in order, but the useful part is causal: this change caused the latency, that rollback prevented a full outage, this other mitigation did nothing. An agent reading a timeline has to re-infer causality from prose under time pressure.",
      },
      {
        label: "Root cause and blast-radius limiter get confused",
        body: "The fix that removes the cause and the action that stops the bleeding are different things. Treating the limiter as the fix leads to the incident returning; treating the fix as urgent leads to a risky change during an outage. CausalEval separates them as C4 inhibition.",
      },
      {
        label: "The obvious mitigation is the one that failed before",
        body: "Restart the pod, fail over the primary, flush the cache. Each has a history, and some of those histories include making things worse. An agent without that history will suggest the same action with the same confidence.",
      },
      {
        label: "Lessons expire silently",
        body: "A workaround from six months ago may now be harmful because the architecture changed. Memory that cannot be superseded becomes a source of confident bad advice.",
      },
    ],
    approach: [
      {
        heading: "Record both directions of causality",
        body: "During and after an incident, record two kinds of edge: what caused the failure, and what prevented it from being worse. The second one is the part most tools drop. A prevented edge carries negative activation, so the mitigation that worked ranks as a thing to repeat, while the one that was tried and did nothing does not get promoted.",
        bullets: [
          "relation: prevented for the rollback, the rate limit, the feature flag that contained the blast radius.",
          "relation: caused for the change or condition that started it.",
          "task_tag: the incident class (database, deploy, dependency), not the incident ID — recall works across incidents of the same class.",
        ],
      },
      {
        heading: "Trace cause before proposing a fix",
        body: "Start from the symptom and walk backwards. trace_cause gives a single hop; trace_cause_chain follows multiple hops to the root. The point is to stop the agent from treating the loudest downstream error as the cause.",
        bullets: [
          "Feed the observed symptom, not your hypothesis — a hypothesis-shaped query returns evidence for the hypothesis.",
          "Use max_depth 3 by default; deeper chains are usually a sign the graph needs better edges, not a deeper query.",
          "Compare the returned chain with the incident timeline; disagreement is a signal that an edge is missing.",
        ],
      },
      {
        heading: "Check the mitigation against history",
        body: "Before suggesting a mitigation, ask what happened last time an action like this was taken. If the answer includes a DANGER chain, the agent should say so explicitly and cite the incident, instead of presenting the action as routine.",
        bullets: [
          "This is a pre-action check, so it runs before the suggestion reaches a human.",
          "A warning is evidence, not a veto: during an outage a known-risky action can still be correct.",
          "The citation is what makes the warning reviewable after the fact.",
        ],
      },
      {
        heading: "Supersede workarounds when the system changes",
        body: "When a workaround stops being safe, supersede it. The old edge remains for counterfactuals ('what would have happened if we had not failed over?'), but the answer model sees the correction. This is the difference between a memory that ages and one that rots.",
        bullets: [
          "Review superseded edges after every architecture change.",
          "A superseded edge is not a wrong memory; it is a dated one, and the date is the point.",
        ],
      },
    ],
    metrics: [
      {
        label: "Repeat incident rate",
        value: "Track per class",
        note: "Share of incidents whose task_tag matches an earlier incident in the same quarter. This is the number causal memory is supposed to move.",
      },
      {
        label: "Inhibition accuracy",
        value: "80% vs 50%",
        note: "CausalEval C4: distinguishing a root-cause fix from a blast-radius limiter, against the mem0 baseline on the 70-question protocol.",
      },
      {
        label: "Intervention accuracy",
        value: "75% vs 40%",
        note: "CausalEval C2: forward prediction of what a repeated action would do. This is the capability behind the pre-mitigation warning.",
      },
      {
        label: "Postmortem completeness",
        value: "Track per incident",
        note: "Whether the postmortem records a prevented edge, not just a timeline. Incidents without one are the ones that will be re-learned.",
      },
      {
        label: "MTTR",
        value: "Track, no published number",
        note: "We do not publish an MTTR improvement. Measure first-response time and time-to-mitigation before and after adoption on your own incidents.",
      },
    ],
    code: [
      {
        title: "1 · Record the mitigation that actually prevented the worse outcome",
        language: "json",
        code: `{
  "name": "record_decision",
  "arguments": {
    "decision": "rolled back the checkout service to the previous image during the latency spike",
    "outcome": "error budget stopped draining; the database stayed below its connection ceiling",
    "relation": "prevented",
    "task_tag": "database",
    "context": "peak traffic, primary at connection limit, rollback available"
  }
}`,
      },
      {
        title: "2 · Trace the symptom back to a cause",
        language: "json",
        code: `{
  "name": "trace_cause_chain",
  "arguments": {
    "outcome_description": "checkout p99 latency rose until the primary hit its connection ceiling",
    "max_depth": 3,
    "min_confidence": 0.5,
    "limit": 5
  }
}`,
      },
      {
        title: "3 · Check the obvious mitigation against history",
        language: "json",
        code: `{
  "name": "intervention_query",
  "arguments": {
    "action": "fail over the primary database during peak traffic",
    "task_tag": "database",
    "max_depth": 3
  }
}`,
      },
    ],
    faq: [
      {
        q: "Does this replace an incident timeline or a postmortem tool?",
        a: "No. It stores the causal claims that a timeline leaves implicit: this caused that, this prevented worse, this did nothing. Keep the timeline; add edges for the parts a future agent needs to reason with.",
      },
      {
        q: "How is a prevented edge different from a note saying 'this worked'?",
        a: "It is typed and it spreads negative activation. At retrieval time, the prevented outcome ranks below neutral, which is what lets intervention_query return a warning instead of a neutral list. A prose note has no ranking effect.",
      },
      {
        q: "Can the agent use this during an active incident?",
        a: "Yes — recall and intervention queries are local SQLite reads by default, so they do not depend on an external service. Recording is safe to do during the incident; waiting until the postmortem loses the context.",
      },
      {
        q: "What about incidents the agent did not handle?",
        a: "Backfill the edges after the postmortem. The value is in the graph, not in whether the agent was present. A backfilled prevented edge warns exactly like a live one.",
      },
      {
        q: "Is the incident data safe?",
        a: "By default it stays in the local causal.db file, which means the same access controls as the machine running it. The hosted option isolates data per tenant; review what your incident data policy allows before sending it to any hosted service.",
      },
    ],
    related: [
      "/use-cases/coding-agent",
      "/use-cases/trading-agent",
      "/integrations/dsh",
      "/integrations/claude-code",
      "/vs/zep",
    ],
    updatedAt: UPDATED_AT,
  },
  {
    slug: "trading-agent",
    name: "Trading agent",
    title: "Causal memory for a trading research agent",
    seoTitle: "Causal memory for trading research",
    description:
      "A trading research agent needs a decision journal it can query: thesis, context, outcome, and counterfactual. Causal memory records why a position was taken — not investment advice.",
    tagline:
      "A P&L number tells you what happened. A causal decision journal tells you which part of your reasoning was wrong — and what you would have gotten if you had done the other thing.",
    persona:
      "For research and trading agents that review their own decisions, where the goal is a better decision process rather than a return promise.",
    painPoints: [
      {
        label: "Outcome bias hides process quality",
        body: "A bad decision can make money and a good one can lose. Without a record of the thesis, the context and the alternative that was rejected, a review cannot tell skill from luck — so the wrong lesson gets reinforced.",
      },
      {
        label: "The market regime is not stored with the decision",
        body: "The same rule behaves differently in different regimes. If the decision is recorded without the volatility and liquidity context it was made in, later recall compares situations that were not comparable.",
      },
      {
        label: "Counterfactuals are guessed, not queried",
        body: "Reviews ask 'what if we had not cut exposure?' and answer from memory. The alternative was known at decision time; if it was recorded, the comparison becomes evidence instead of narrative.",
      },
      {
        label: "The journal is prose nobody queries",
        body: "A notes file grows for years and is never read again. A structured, searchable edge is what a review can actually use.",
      },
    ],
    approach: [
      {
        heading: "Record the decision with the alternative attached",
        body: "Every position or sizing decision becomes an edge: the decision, the alternative that was rejected, the context (regime, volatility, liquidity), and the outcome observed later. Recording the alternative is what makes a counterfactual query possible instead of rhetorical.",
        bullets: [
          "task_tag: the decision type — entry, exit, sizing, hedge, review.",
          "context: regime and constraints, so two decisions are only compared when they are comparable.",
          "outcome: fill it in when the horizon closes, not at entry. An unobserved outcome is not an edge yet.",
        ],
      },
      {
        heading: "Compare against the path not taken",
        body: "counterfactual_query contrasts the recorded decision with the stated alternative in similar historical situations. It reports empirical evidence from the graph — not a market simulation and not a forecast. The output is a comparison of what the two choices produced, which is exactly what a review needs.",
        bullets: [
          "The alternative must be written at decision time; inventing it later is hindsight.",
          "A result of 'insufficient evidence' is a valid answer and should be reported as such.",
          "This is a research tool; it does not predict prices and does not produce buy or sell calls.",
        ],
      },
      {
        heading: "Review the process, not only the P&L",
        body: "At the review horizon, search the decision type and read the edges in order. The useful question is not 'did this make money' but 'was the reasoning that produced it sound, and did the outcome follow for the reason we expected'. CausalEval C3 counterfactual is the capability under test here: 95% vs 80%.",
        bullets: [
          "Score the process separately from the outcome.",
          "Supersede a rule when the evidence falsifies it; keep the old edge for the counterfactual record.",
          "Look for repeated task_tags with opposite outcomes — that is where the process is inconsistent.",
        ],
      },
    ],
    metrics: [
      {
        label: "Decision review coverage",
        value: "Track quarterly",
        note: "Share of positions whose thesis, alternative and outcome are all recorded. A journal with missing alternatives cannot support counterfactual review.",
      },
      {
        label: "Counterfactual accuracy",
        value: "95% vs 80%",
        note: "CausalEval C3, choosing between alternatives with known outcomes, against the mem0 baseline on the 70-question protocol.",
      },
      {
        label: "Thesis hit rate",
        value: "Track per strategy",
        note: "How often the recorded outcome matched the recorded expectation, independent of P&L. We publish no customer numbers for this.",
      },
      {
        label: "Belief revision",
        value: "100%",
        note: "CausalEval C7: superseding a rule after falsification. Relevant when a regime change invalidates a rule that used to work.",
      },
      {
        label: "Repeat-mistake rate",
        value: "33% vs 67%",
        note: "trap-world benchmark, causal-memory vs the fact-store baseline. For a research process, track re-entered positions that repeat a previously recorded error.",
      },
    ],
    code: [
      {
        title: "1 · Record a decision and the alternative that was rejected",
        language: "json",
        code: `{
  "name": "record_decision",
  "arguments": {
    "decision": "cut gross exposure before the scheduled macro release",
    "outcome": "realised volatility stayed below the level the position was sized for",
    "relation": "caused",
    "task_tag": "sizing",
    "context": "event week, elevated implied vol, thin liquidity in the underlying"
  }
}`,
      },
      {
        title: "2 · Compare with the path not taken",
        language: "json",
        code: `{
  "name": "counterfactual_query",
  "arguments": {
    "decision": "cut gross exposure before the scheduled macro release",
    "alternative": "hold gross exposure through the macro release",
    "task_tag": "sizing",
    "limit": 5
  }
}`,
      },
      {
        title: "3 · Recall the last time this decision type was reviewed",
        language: "json",
        code: `{
  "name": "search_causal",
  "arguments": {
    "task_tag": "sizing",
    "query": "event-week exposure decision",
    "limit": 5,
    "detail_level": "l2"
  }
}`,
      },
    ],
    faq: [
      {
        q: "Is this investment advice?",
        a: "No. causal-memory is a memory and research tool. It records decisions and their observed outcomes and compares them; it does not generate buy or sell recommendations, targets, or return promises. Nothing on this page is investment advice.",
      },
      {
        q: "Does it predict prices?",
        a: "No. counterfactual_query compares the recorded outcomes of a decision and a stated alternative in similar past situations. That is an empirical comparison over stored evidence, not a forecast and not a simulation of the market.",
      },
      {
        q: "What is the minimum useful journal?",
        a: "Three fields per decision: the decision, the alternative rejected, and the context. Without the alternative, the review can only ask 'did it work'; with it, the review can ask 'was it better than the other choice'.",
      },
      {
        q: "How is this different from a spreadsheet journal?",
        a: "A spreadsheet stores rows; it does not rank them by causal relevance or answer a counterfactual across years of entries. The graph does both, and the same store also holds the facts and context the decision depended on.",
      },
      {
        q: "Can a research team share the journal?",
        a: "The server supports multi-tenant HTTP with a token file, one database per tenant, so teams can isolate journals. The engine and this website are not a broker, an exchange or an order-routing system.",
      },
    ],
    related: [
      "/use-cases/on-call-agent",
      "/use-cases/coding-agent",
      "/integrations/dsh",
      "/integrations/claude-code",
      "/vs/letta",
    ],
    updatedAt: UPDATED_AT,
  },
];

export const useCaseBySlug = new Map(useCases.map((u) => [u.slug, u]));
