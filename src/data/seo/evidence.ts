import type { EvidenceRow } from "./types";

/**
 * Every number rendered on the pSEO pages comes from this file.
 *
 * Source: `causal-memory/README.md` (v0.10.0) and
 * `causal-memory/docs/benchmarks/causal-eval-2026.md`, read on 2026-10-21.
 * Do not add a figure here that is not in those two files — the comparison
 * pages are only credible while the numbers stay checkable.
 */

export const EVIDENCE_DATE = "2026-10-21";
export const EVIDENCE_SOURCE = "causal-memory README v0.10.0 · CausalEval v13";

export const CAUSALEVAL_PROTOCOL = {
  version: "v13 (soft supersession)",
  questions: 140,
  graphs: 20,
  baseline: "v12: 70 questions / 10 graphs · mem0 comparison ran on the same 70q protocol",
  judge: "same LLM, same judge",
} as const;

/** CausalEval v13: our column vs the 70q baseline that mem0 also ran. */
export const CAUSALEVAL_ROWS: EvidenceRow[] = [
  {
    capability: "C7 Update",
    ours: "100%",
    baseline: "80%",
    tests: "Supersede an old belief after it is falsified, and keep the old edge retrievable",
  },
  {
    capability: "C3 Counterfactual",
    ours: "95%",
    baseline: "80%",
    tests: "Choose between alternatives with known outcomes",
  },
  {
    capability: "C2 Intervention",
    ours: "75%",
    baseline: "40%",
    tests: "Forward prediction: if X happens again, what follows?",
  },
  {
    capability: "C4 Inhibition",
    ours: "80%",
    baseline: "50%",
    tests: "Separate the root-cause fix from the blast-radius limiter",
  },
  {
    capability: "C1 Attribution",
    ours: "85%",
    baseline: "90%",
    tests: "Walk a backward causal chain to the root cause",
  },
  {
    capability: "C5 Temporal-causal",
    ours: "90%",
    baseline: "90%",
    tests: "Order events on a causal chain",
  },
  {
    capability: "C6 Lesson transfer",
    ours: "20%",
    baseline: "30%",
    tests: "Cross-task analogy through meta edges — still an open limitation",
  },
  {
    capability: "Overall",
    ours: "78%",
    baseline: "65%",
    tests: "All C1-C7 classes weighted equally",
  },
];

/** Fact-recall suites: causal-memory is competitive but does not lead. */
export const FACT_RECALL_ROWS: EvidenceRow[] = [
  {
    capability: "LoCoMo (strict judge)",
    ours: "79.1%",
    baseline: "91.6%",
    tests: "mem0's home turf — atomic fact extraction and recall",
  },
  {
    capability: "LongMemEval-S",
    ours: "76.4% @ 11.5K tok/q",
    baseline: "94.4% official · 73.8% independent repro",
    tests: "Single-model stack vs a platform stack; not a like-for-like number",
  },
  {
    capability: "Memora MPA",
    ours: "67.4%",
    baseline: "71.8%",
    tests: "−4.4pp; fact-heavy multi-session recall",
  },
  {
    capability: "Compaction survival",
    ours: "100%",
    baseline: "45%",
    tests: "Recall after 5x context compaction; the causal table lives outside the window",
  },
  {
    capability: "Agent repeat-mistake",
    ours: "33%",
    baseline: "67%",
    tests: "−34pp on trap-world: how often the agent repeats a known-bad action",
  },
];

export const CAUSALEVAL_HEADLINE =
  "C7 update moved from 50% (v12) to 100% (v13) once superseded edges were annotated instead of hidden, and it held at doubled sample size. C6 lesson transfer is still 20% against mem0's 30% — that gap is open.";

/** Counts that appear across pages; one place to keep them honest. */
export const PRODUCT_FACTS = {
  mcpTools: 17,
  workspaceTests: 322,
  edgeTypes: ["caused", "enabled", "prevented", "no_effect", "fact", "meta", "co_occurrence"],
  preventedSpread: "−0.3",
  license: "Apache-2.0",
  storage: "one SQLite file (causal.db)",
  status: "v0.10.0-alpha",
} as const;

/** The gap we lead with on every comparison page. */
export const MEM0_FACT_RECALL_GAP =
  "mem0 is stronger at fact recall: 91.6% vs 79.1% on LoCoMo with a strict judge.";
