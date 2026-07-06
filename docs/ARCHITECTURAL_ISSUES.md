# Architectural issues discovered during IA-003 implementation

Per IA-003's Stop Conditions: *"any apparent need for an architecture
change is a STOP-and-document condition — document it, recommend an ADR,
and wait for approval. Do not work around it in code."* This document
records every such condition found while implementing Phase P2. None of
them were worked around; each was handled with the narrowest possible,
clearly labeled, documented placeholder, exactly where the governing
corpus itself already anticipated the gap.

## 1. ADR-0001 — no repository owns the schema for domain-specific Canonical Objects (open, pre-existing)

**Where it surfaces in this implementation:** `src/canonicalInputGateway.ts`.

The NSCLC Enterprise Knowledge Slice specification (v1.1, Section 3) states
that 13 of its 14 Canonical Objects (all except `EvidencePackageManifest`)
have **no approved schema-owning repository**, pending ADR-0001. RISX-Core
depends on canonical object schemas to validate inbound objects at its
boundary (GR: Canonical Input Gateway), so Phase P2 cannot compile or run
without *some* schema to validate against.

**What this implementation did:** defined local, explicitly-labeled,
provisional Zod schemas in `src/canonicalInputGateway.ts`, scoped to only
the fields the NSCLC slice's Canonical Object Inventory (Section 3)
describes as "required (conceptual)" for this slice's five modules. The
file header states plainly that these schemas are not a claim of
ownership and must be replaced by RISX-Common imports once ADR-0001
resolves — they are not proposed as the answer to ADR-0001.

**Recommendation:** ADR-0001 should be resolved before any second
Implementation Assignment extends the Canonical Object surface (e.g. a
second disease domain), because every such extension will otherwise repeat
this same provisional-schema pattern in a different repository, compounding
drift risk. No urgency for Phase P2 itself, since its schemas are narrow,
local, and clearly marked.

## 2. ADR-0002 — aggregate confidence computation rule (open, pre-existing)

**Where it surfaces in this implementation:**
`src/modules/recommendationGeneration.ts`.

The NSCLC slice (Section 12.2) records that the rule for aggregating
per-dimension `TypedConfidence` values (evidence strength, applicability,
source agreement, statistical uncertainty) into a single confidence value
is still an open question.

**What this implementation did:** applied the simplest possible rule —
reporting the dimensions themselves rather than collapsing them, and
tagging every `TypedConfidence` value with an explicit
`aggregationPolicyVersion` of
`"provisional-unweighted-mean-v0-pending-ADR-0002"` so that (a) it is
versioned and auditable per GR-33, and (b) any consumer can tell at a
glance that this is not the ratified rule.

**Recommendation:** ADR-0002 should be resolved before Phase P3 (if P3
introduces cross-domain aggregation, which would need a real answer to
combine confidences across domains, not just within one).

## 3. RISX-Common exists and is ratified, but its shared contracts structurally conflict with what the Computational Core / NSCLC governing docs require (new finding, supersedes an earlier draft of this document)

**Severity: highest finding in this report — recommend resolving before any
further Computational Core implementation work.**

**Where it surfaces in this implementation:** `src/types.ts` (and,
transitively, `src/auditReplay.ts`, `src/modules/recommendationGeneration.ts`).

An earlier draft of this document incorrectly stated that
`devrisxsci/RISX-Common` does not exist. It does exist, and — per its own
`docs/AMBIGUITIES.md` — its `ClinicalResult`, `RecommendationObject`,
`TypedConfidence`, `AuditObject`, and `EvidencePackageManifest` contracts
were explicitly ratified as approved, non-provisional platform contracts
under **IA-001A**. The Computational Core architecture (Section 40) and the
NSCLC slice (Section 7) require RISX-Core to depend on exactly these
RISX-Common types for boundary-crossing objects and to define none of its
own. On inspection, however, three of them are **structurally incompatible**
with what the Computational Core architecture and the NSCLC Knowledge
Slice v1.1 specify in detail for this exact use case:

1. **`TypedConfidence`.** RISX-Common's ratified shape is a single scalar:
   `{ basis: enum, score: number, producedBy: string, rationale?: string }`.
   The Computational Core architecture (Section 26) and the NSCLC slice
   (Section 12.2) both specify a **four-dimensional** confidence structure —
   independent `evidenceStrength`, `applicability`, `sourceAgreement`, and
   optional `statisticalUncertainty` scores that a consumer needs
   individually, not pre-collapsed to one scalar — and ADR-0002 (still open)
   is specifically about how those four dimensions aggregate. RISX-Common's
   `TypedConfidence` has already picked a shape that presupposes a *single*
   score per confidence value, which forecloses the multi-dimensional model
   the NSCLC slice depends on, without an ADR that reconciles the two.

2. **`AuditObject`.** RISX-Common's ratified shape is a generic action-log
   entry: `{ actor, action, target, timestamp, outcome, details? }` — suited
   to recording things like `"project.create"` events. The Computational
   Core architecture's "Audit Object" (Sections 34-38; GR-28, GR-29) is a
   different concept that happens to share the name: an **execution-sealing
   record** containing `moduleSet`, `evidenceSnapshot`,
   `canonicalInputFingerprint`, `executionDag`, `resultHash`,
   `confidenceHash`, and bitemporal fields, whose entire purpose is
   supporting bit-for-bit deterministic replay. There is no field in
   RISX-Common's `AuditObjectSchema` that can carry `resultHash` /
   `confidenceHash` / `evidenceSnapshot` / `executionDag` without repurposing
   the generic `details` bag for a role the schema's own documentation does
   not describe.

3. **`ClinicalResult` / `RecommendationObject`.** Ratified as **pure
   envelopes with no domain payload field, by explicit design** (per
   `docs/AMBIGUITIES.md` item 1: "no disease-specific fields ... no
   recommendation logic"). This is consistent with IA-001A's intent, but it
   leaves genuinely open how a domain module (e.g. this slice's
   Recommendation Generation Module) is supposed to attach its actual output
   (ranked regimens, confidence per regimen, contraindication reasons) to the
   object the platform expects back. `metadata` is documented as
   "non-domain-specific," so it is not a sanctioned place either. This is
   not a defect in RISX-Common — it is a genuinely unresolved question about
   how domain results attach to the shared envelope, not decided by either
   repository's approved documents.

**What this implementation did:** did **not** import RISX-Common's
`TypedConfidence`, `AuditObject`, `ClinicalResult`, or `RecommendationObject`
into RISX-Core, and did **not** modify RISX-Common. Either move would have
required silently picking a winner between two ratified-but-conflicting
specifications, which is exactly the kind of architectural decision IA-003
prohibits this implementation from making. `src/types.ts` keeps the local,
explicitly-labeled, provisional shapes that already existed for Phase P2 —
the four-dimensional `TypedConfidence` and execution-sealing `AuditObject`
the NSCLC slice and Computational Core architecture actually require — with
its header comment updated to name this specific conflict rather than
merely "RISX-Common does not exist yet."

**Recommendation:** raise an ADR that reconciles, for each of the three
contracts above, which specification governs:
- For `TypedConfidence`: either (a) RISX-Common's schema is extended to
  support a multi-dimensional variant, or (b) the Computational Core /
  NSCLC per-dimension confidence is declared a domain-analytics-internal
  concept that is deliberately collapsed to RISX-Common's single-scalar
  `TypedConfidence` only when crossing the platform boundary (in which case
  the collapse rule is itself ADR-0002's open question).
- For `AuditObject`: either (a) rename the Computational Core's concept
  (e.g. `ExecutionSealRecord`) so it stops colliding with RISX-Common's
  `AuditObject`, or (b) extend RISX-Common's `AuditObjectSchema` with an
  execution-sealing variant.
- For `ClinicalResult` / `RecommendationObject` domain payload: decide where
  a domain module's actual output attaches — a new, ADR-approved payload
  field on the shared envelope, or a separate domain-owned canonical object
  type (would itself need an ADR-0001-style ownership decision) referenced
  by id from the envelope's `evidenceRefs`/`moduleRefs`/`metadata`.

This should be resolved before any second Implementation Assignment (a
second clinical domain, or a non-clinical domain) proceeds, since every
such assignment will hit the exact same three conflicts independently
otherwise.
