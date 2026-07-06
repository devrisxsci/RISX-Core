# RISX-Core

The RISX Platform's Computational Core (Layer 6) — the deterministic,
auditable, replay-verifiable reasoning engine of the platform.

## Governance

This repository implements against the governing corpus published in
`devrisxsci/RISX-Architecture`, pinned at the annotated tag
**`architecture-v1.0`** (tag object `c9a0222f99df73a6de0ac372c7d4e082d659f15c`,
commit `54a8766f25c8541b5755a1e14f3da9d1572754d8`). No architectural decision
is made in this repository. Where the governing corpus leaves a question
open (see [`docs/ARCHITECTURAL_ISSUES.md`](docs/ARCHITECTURAL_ISSUES.md)),
this implementation documents the gap and applies the narrowest possible,
clearly-labeled, versioned placeholder rather than resolving it — per
Implementation Assignment IA-003's Stop Conditions: *"any apparent need for
an architecture change is a STOP-and-document condition, never a code
workaround."*

**Important:** `devrisxsci/RISX-Common` (ratified under IA-001A) already
defines `TypedConfidence`, `AuditObject`, `ClinicalResult`, and
`RecommendationObject` as the platform's shared boundary-crossing contracts,
and RISX-Core is architecturally required to depend on them rather than
define its own. On inspection, three of those ratified contracts are
**structurally incompatible** with what the Computational Core architecture
and the NSCLC Knowledge Slice v1.1 require for this exact use case (see
finding 3 in [`docs/ARCHITECTURAL_ISSUES.md`](docs/ARCHITECTURAL_ISSUES.md)
for the field-by-field detail). This implementation does not import them —
doing so would require silently picking a winner between two
ratified-but-conflicting specifications, an architectural decision this
implementation is not authorized to make. `src/types.ts` keeps the local,
provisional shapes Phase P2 needs until an ADR reconciles the conflict.

## Scope — Implementation Assignment IA-003

This implementation is **Master Program Plan Phase P2 — "Mechanical
Spine"**, for **NSCLC Clinical Reasoning only**. It proves the Core's
end-to-end mechanics — admission, evidence pinning, module orchestration,
recommendation assembly, and deterministic sealed-audit replay — for a
single clinical domain. It explicitly does **not** implement cross-domain
reasoning, a real Knowledge Compiler / Evidence Repository, a network wire
protocol between modules, or any UI/Studio/Integration Platform component.
See [`docs/PHASE_P2_SCOPE.md`](docs/PHASE_P2_SCOPE.md) for the complete
in-scope / out-of-scope boundary and the reasoning behind each Phase P2
simplification.

## Components implemented (Computational Core architecture, Part II)

| Component | File |
|---|---|
| Canonical Input Gateway | `src/canonicalInputGateway.ts` |
| Evidence Query Layer | `src/evidenceQueryLayer.ts` |
| Module Registry | `src/moduleRegistry.ts` |
| Module Orchestrator | `src/moduleOrchestrator.ts` |
| Analytics Runtime (8-phase pipeline: ADMIT→PIN→CONTEXT→PLAN→EXECUTE→RESOLVE→ASSEMBLE→SEAL) | `src/analyticsRuntime.ts` |
| Recommendation Assembler | `buildClinicalResult` in `src/auditReplay.ts` |
| Audit & Replay Subsystem | `src/auditReplay.ts` |
| Cross-Domain Reasoner | Not implemented — Phase P2 is single-domain by Master Program Plan directive; RESOLVE executes as a documented no-op (see `src/analyticsRuntime.ts`) rather than being silently skipped. |
| Intended-Use Controller | Represented minimally as the `intendedUsePosture` field threaded through `ExecutionContext` → `AuditObject` / `RecommendationObject`; no posture-based gating logic is introduced in Phase P2. |
| Knowledge Domain Registry | Represented by the fixed `clinical.nsclc` domain tag on each registered module; a general multi-domain registry is out of scope for a single-domain phase. |

## Clinical Reasoning Modules (NSCLC Knowledge Slice v1.1, Section 6)

Five modules, registered in the Module Registry and sequenced by the Module
Orchestrator exactly per the slice's dependency matrix:

```
Staging Module ───────────┐
                           ├──▶ Guideline Matching Module ──▶ Regimen Selection Module ──▶ Recommendation Generation Module
Biomarker Interpretation ─┘
```

- `src/modules/staging.ts`
- `src/modules/biomarkerInterpretation.ts`
- `src/modules/guidelineMatching.ts`
- `src/modules/regimenSelection.ts`
- `src/modules/recommendationGeneration.ts`

## Evidence Packages

Fixture Evidence Packages standing in for the five packages named in the
NSCLC slice (`src/evidence/fixtures.ts`): AJCC Staging Manual, Biomarker
Definitions, NCCN NSCLC Guidelines, FDA Drug Labels. Each fixture carries a
real, verifiable SHA-256 content hash over its canonicalized body, computed
by `src/hash.ts`. There is no digital signature chain, because there is no
Knowledge Compiler (L4) to be the trusted signer yet — see
`docs/ARCHITECTURAL_ISSUES.md`.

CAP/IASLC Classification is referenced conceptually by the `Histology`
canonical input's `classificationSystem` field but has no fixture package in
Phase P2, because no clinical module in this slice queries it directly
(Guideline Matching consumes `Histology` as a canonical input, not as an
Evidence Package lookup) — this is a scope-minimization choice for the
Mechanical Spine, not a defect.

## Running

```bash
npm install
npm run typecheck
npm test
```

## Tests executed

21 automated tests across 4 suites (`npm test`), all passing:

- `test/canonicalInputGateway.test.ts` — boundary admission/rejection, closed-set validation, whole-admission-fails-on-one-invalid-object.
- `test/evidenceQueryLayer.test.ts` — pinned-snapshot correctness, rejection of unpinned package queries, predicate filtering, content-hash stability.
- `test/moduleOrchestrator.test.ts` — registry duplicate-registration rejection, correct topological plan for the real 5-module NSCLC pipeline, cycle rejection at planning time, non-deterministic-output-ownership rejection.
- `test/analyticsRuntimeAndReplay.test.ts` — full end-to-end NSCLC clinical reasoning (EGFR-positive Stage IV → osimertinib recommendation), contraindication exclusion, unclassified-biomarker surfacing (never silently dropped), Canonical Input Gateway boundary rejection, AJCC-uncovered-staging validation failure (no best-guess default), pure-function determinism (identical inputs → identical result/confidence hashes), **and full deterministic replay from a sealed Audit Object, plus replay-divergence detection**.

## Replay validation

`verifyReplay()` in `src/auditReplay.ts` re-derives the canonical input
fingerprint and recomputes the result/confidence hashes from a fresh
execution against the same recorded module versions, evidence snapshot, and
execution context, then compares every value to the sealed `AuditObject`
by exact bit-for-bit hash equality (Computational Core architecture,
Section 37; GR-29). The test suite exercises both the identical-replay path
and the divergence path (`ReplayDivergenceError`, never reconciled).
