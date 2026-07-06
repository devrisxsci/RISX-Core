# Phase P2 — "Mechanical Spine" scope boundary

Per the Master Program Plan and Implementation Assignment IA-003, this is
what Phase P2 is and is not.

## In scope

- The Computational Core's admission → pinning → planning → execution →
  assembly → sealing mechanics, for exactly one domain (`clinical.nsclc`).
- The five NSCLC Clinical Reasoning Modules (Staging, Biomarker
  Interpretation, Guideline Matching, Regimen Selection, Recommendation
  Generation) and their exact declared dependency matrix (NSCLC Knowledge
  Slice v1.1, Section 6).
- Deterministic execution: identical canonical inputs + identical pinned
  evidence + identical execution context always produce an identical
  result hash and confidence hash.
- A sealed `AuditObject` per execution and a working replay path that
  detects divergence rather than reconciling it (GR-28, GR-29).
- Evidence Package pinning-by-version-and-hash against fixture packages
  standing in for the five NSCLC-relevant packages.
- Canonical Object admission against locally-scoped, provisional schemas
  (see `docs/ARCHITECTURAL_ISSUES.md` — ADR-0001 is still open).

## Out of scope for Phase P2 (explicitly, not by omission)

- **Cross-domain reasoning.** The Cross-Domain Reasoner and the RESOLVE
  phase's conflict-resolution logic are not implemented; RESOLVE runs as a
  documented no-op because a single domain cannot generate a cross-domain
  conflict. A future phase that registers a second domain must implement
  real conflict resolution before RESOLVE can remain a no-op.
- **A real Knowledge Compiler / Evidence Repository.** Evidence Packages
  are fixtures with real content hashes but no digital signature chain,
  because no Knowledge Compiler exists yet to be the trusted signer
  (EP-13). RISX-Core does not implement a compiler; that is Layer 4's
  responsibility per the Computational Core architecture, Section 42.
- **A network wire protocol between modules.** All five modules run
  in-process, invoked only through the Module Orchestrator (GR-12). The
  Computational Core architecture treats the module contract as
  language/transport-neutral (Sections 10-11); Phase P2 does not need to
  cross a real process boundary to prove the mechanical spine, and
  introducing one would be scope creep, not a requirement of this
  assignment.
- **Enterprise Integration Platform, RISX Studio, or any Application
  layer.** RISX-Core has no connectors, no UI, and no knowledge of any
  external system, per GR-32 and Section 41. Canonical inputs in this
  repository's tests are constructed directly as already-canonical
  objects, standing in for what the Integration Platform would have
  produced.
- **RISX-Common as a real, separate, versioned package.** RISX-Common does
  not exist yet as a repository. `src/types.ts` defines local, clearly
  labeled, provisional stand-ins for the RISX-Common contracts this slice
  needs (`TypedConfidence`, `ClinicalResult`, `RecommendationObject`,
  `AuditObject`, `EvidencePackageManifest`). These are not proposed as the
  RISX-Common contract; they exist only to let Phase P2's pipeline compile
  and run. See `docs/ARCHITECTURAL_ISSUES.md` for why this is a documented
  gap rather than a silent one.
- **A durable canonical-input archive.** The governing architecture places
  durable storage of historical inputs outside the Computational Core
  (Sections 39-43). Replay in this implementation accepts the original
  canonical inputs as an explicit caller-supplied argument, the way an
  external caller (e.g. Studio) would supply them from wherever they are
  archived, rather than RISX-Core inventing its own archive.
