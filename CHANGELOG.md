# CHANGELOG

  ## [Unreleased] — X-005 Policy versions conform to semver (2026-07-15)

  ### BREAKING CHANGE to audit provenance (NOT to clinical reasoning)

  ExecutionContext policy versions are now semantic versions, as Common's
  AuditObjectSchema has required since Core pinned RISX-Common v2.0
  (SemanticVersionSchema on precedencePolicyVersion and
  confidencePolicyVersion). Core had failed its own pinned contract since
  Stage C; X-003's AuditObjectSchema.parse() exposed it, and this change
  closes it (PO decision: Option A — Core conforms, Common stays frozen).

  **What changed:**

  | Field | Before | After |
  |---|---|---|
  | `precedencePolicyVersion` | `precedence-v0-single-domain` | `0.1.0-single-domain` |
  | `confidencePolicyVersion` | `provisional-unweighted-mean-v0-pending-ADR-0002` | `0.1.0-provisional-unweighted-mean.pending-adr-0002` |

  **Audit hashes that changed (all NSCLC runs):** `audit.id` is sha256Hex over
  an object that includes the whole executionContext (auditReplay.ts), so
  audit ids change for EVERY execution. Replay recomputes both sides, so
  bit-for-bit replay (GR-29) must still pass. Clinical conclusions and
  ranking are UNCHANGED — no module logic, evidence, or reasoning was touched.
  The prerelease fields carry the full original policy semantics; ADR-0002
  remains open (the confidence aggregation rule is versioned, not decided).

  ## [Unreleased] — AR1 Step 2 (2026-07-07)

  ### BREAKING CHANGE to audit provenance (NOT to clinical reasoning)

  NCCN evidence now sourced from the compiled Evidence Package (compilerId
  "risx-knowledge-compiler"); evidenceSnapshot hashes change accordingly.
  Clinical conclusions are unchanged (verified by reasoning-equivalence gate).

  **What changed:**

  - `NccnDecisionPointClaim` removed from `src/evidence/fixtures.ts` and from
    the package's public API (previously exported via `src/index.ts`). The type
    was a fixture-era stand-in; the claim shape is now owned by the compiler.
  - `NCCN_NSCLC_GUIDELINES` is no longer a hand-authored fixture. It is loaded
    from the committed artifact `src/evidence/compiled/nccn-nsclc-package.ts`,
    which is the verbatim output of RISX-Knowledge-Compiler v1.0.0.
  - `ALL_FIXTURE_PACKAGES` still exports all four packages; only the NCCN entry
    changed identity.
  - `src/modules/guidelineMatching.ts` no longer imports `NccnDecisionPointClaim`
    from fixtures. The module reads compiled assertions via its own local
    `GuidelineDecisionPointClaim` interface (module reading contract, not a domain
    claim re-declaration).

  **Audit hashes that changed (all NSCLC runs):**

  | Field | Before (fixture era) | After (compiled era) |
  |---|---|---|
  | `evidenceSnapshot[nccn-nsclc-guidelines].manifestHash` | fixture value (fixture compilerId) | `3fcf5489c460ca00…` |
  | `audit.id` | fixture-era value | changes on every new execution |

  **Clinical conclusions unchanged (reasoning-equivalence verified):**

  The compiled package carries the same three decision points (EGFR-EX19DEL →
  osimertinib-monotherapy, ALK-FUSION → alectinib-monotherapy, no-driver →
  carboplatin-pemetrexed-pembrolizumab) with the same stageValue, biomarkerCode,
  therapies, and evidenceStrength as the fixture. The B2 reasoning-equivalence
  gate passed (osimertinib top ranked, identical regimen list). The B3 replay
  gate passed (GR-29 bit-for-bit).

  **Compiled package provenance:**

  | Field | Value |
  |---|---|
  | compilerId | risx-knowledge-compiler |
  | compilerVersion | 1.0.0 |
  | packageId | nccn-nsclc-guidelines |
  | version | 2026.3.0+NCCN-NSCLC |
  | manifestHash | 3fcf5489c460ca007c10544dc6edb7ac02bd0766ca512d8ca9de411b0579396e |
  | createdAt | 2026-01-01T00:00:00.000Z |
  | D1 inputs | nccn-ev-egfr-ex19del-iv (ad622229…), nccn-ev-alk-fusion-iv (03c67294…), nccn-ev-no-biomarker-iv (6025ea1a…) |
  