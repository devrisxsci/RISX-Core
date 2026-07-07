/**
 * RISX-Core — types (Phase P2, Mechanical Spine).
 *
 * STAGE C — All four previously-held surfaces are now repointed to
 * @risx/common v2.0 (main @ 3c7ecd55), completing the Stage C conformance:
 *
 * Previously consumed (Stage A/B): `AuditObject`, `EvidencePackageManifest`,
 * `IntendedUse`.
 *
 * Now consumed (Stage C final batch):
 *  - `TypedConfidence` — four concrete dimensions per ADR-0002 Part A:
 *      evidenceStrength (string categorical label), applicability/
 *      sourceAgreement (number [0,1]), statisticalUncertainty (number,
 *      optional). The AGGREGATION RULE (ADR-0002 Part B) remains open.
 *  - `ClinicalResult` — RISX-Common envelope; domain payload goes in
 *      `conclusion: unknown` (CC §27/ADR-0001).
 *  - `RecommendationObject` — RISX-Common envelope; domain payload goes in
 *      `conclusion: unknown` + `resolvedConflicts: []` (Phase P2 single-
 *      domain, no cross-domain conflicts).
 *  - `ModuleDefinition` — imported and re-exported; no `dependencies` field
 *      (ADR-0005). Core-local `ModuleRegistration` extends the static fields
 *      with the in-process `run` function.
 *
 * Core-local types that remain:
 *  - `NsclcRecommendationConclusion` — domain-specific payload placed in
 *      `RecommendationObject.conclusion`. Previously the provisional local
 *      `RecommendationObject`; renamed in Stage C to make the
 *      envelope/conclusion split explicit (ADR-0001: RISX-Common owns the
 *      envelope, not the clinical payload).
 *  - `RegimenCandidate` — domain-specific candidate shape; `confidence` now
 *      uses the concrete RISX-Common `TypedConfidence` (string
 *      evidenceStrength, numeric applicability/sourceAgreement).
 *  - `ModuleRegistration` — runtime extension of `ModuleDefinition` that
 *      adds the `run` function needed by the Core execution engine.
 *  - `ExecutionContext`, `EvidencePackage`, etc. — Phase P2 runtime contracts.
 */

import type {
  AuditObject,
  EvidencePackageManifest,
  IntendedUse,
  TypedConfidence,
  ClinicalResult,
  RecommendationObject,
  ModuleDefinition,
  ConfidenceDimension,
  Provenance,
} from "@risx/common";

export type {
  AuditObject,
  EvidencePackageManifest,
  IntendedUse,
  TypedConfidence,
  ClinicalResult,
  RecommendationObject,
  ModuleDefinition,
  ConfidenceDimension,
  Provenance,
};

// ---------------------------------------------------------------------------
// RISX Canonical Object envelope (provisional — see file header)
// ---------------------------------------------------------------------------

export interface CanonicalObjectEnvelope<TPayload = unknown> {
  readonly canonicalObjectType: string;
  readonly id: string;
  readonly payload: TPayload;
}

// ---------------------------------------------------------------------------
// Execution context (CC §5.2) — every value that could otherwise vary
// between two identical executions is carried explicitly.
// `intendedUsePosture` is typed against @risx/common's `IntendedUse`.
// ---------------------------------------------------------------------------

export interface ExecutionContext {
  readonly injectedTimeIso: string;
  readonly randomSeed: string;
  readonly tenantId: string;
  readonly precedencePolicyVersion: string;
  readonly confidencePolicyVersion: string;
  readonly intendedUsePosture: IntendedUse;
}

// ---------------------------------------------------------------------------
// Evidence Package (EPS §14-19)
// ---------------------------------------------------------------------------

export interface EvidenceAssertion<TClaim = unknown> {
  readonly assertionId: string;
  readonly evidenceCategory: string;
  readonly claim: TClaim;
  readonly citation: string;
}

export interface EvidencePackage<TClaim = unknown> {
  readonly manifest: EvidencePackageManifest;
  readonly source: string;
  readonly assertions: ReadonlyArray<EvidenceAssertion<TClaim>>;
}

export interface EvidenceSnapshot {
  readonly packages: ReadonlyArray<EvidencePackageManifest>;
}

// ---------------------------------------------------------------------------
// Module contract (CC §10-11).
//
// `ModuleDefinition` (RISX-Common manifest, no `dependencies` per ADR-0005)
// is imported and re-exported above. `ModuleRegistration` adds the `run`
// function needed by the Phase P2 in-process engine; it is Core-local
// because CC §11 specifies only the manifest, not a same-process invocation
// contract.
//
// `confidenceProfile` uses `ConfidenceDimension` (RISX-Common) so declared
// dimensions are consistent with `TypedConfidence`'s concrete fields.
//
// `declaredOutputs` remains a single string (the producer key used by the
// orchestrator's declaration-derived DAG); each module in this Phase P2
// single-domain slice produces exactly one output type.
//
// NO `dependencies` field: per ADR-0005 the Orchestrator derives the
// dependency graph from `declaredInputs`/`declaredOutputs` alone (CC §8.2).
// ---------------------------------------------------------------------------

export interface ModuleRegistration<TInputs, TOutput> {
  readonly moduleId: string;
  readonly version: string;
  readonly domain: string;
  readonly declaredInputs: ReadonlyArray<string>;
  readonly declaredOutputs: string;
  readonly confidenceProfile: ReadonlyArray<ConfidenceDimension>;
  readonly deterministic: true;
  readonly requiresInjectedRandomness: boolean;
  readonly run: (inputs: TInputs, ctx: ModuleRunContext) => TOutput;
}

export interface ModuleRunContext {
  readonly executionContext: ExecutionContext;
  readonly evidence: EvidenceQueryHandle;
  readonly canonicalInputs: ReadonlyMap<string, CanonicalObjectEnvelope>;
  readonly upstream: ReadonlyMap<string, unknown>;
}

export interface EvidenceQueryHandle {
  queryAssertions<TClaim = unknown>(
    packageId: string,
    predicate?: (a: EvidenceAssertion<TClaim>) => boolean
  ): ReadonlyArray<EvidenceAssertion<TClaim>>;
  packageManifest(packageId: string): EvidencePackageManifest;
}

// ---------------------------------------------------------------------------
// NSCLC domain types (Core-local, Phase P2).
//
// `RegimenCandidate` — domain-specific candidate shape.
//   `confidence` uses the concrete RISX-Common `TypedConfidence` (ADR-0002
//   Part A): `evidenceStrength` is the guideline-category string label (e.g.
//   "NCCN-Category-1"), not a number; `applicability`/`sourceAgreement` are
//   numbers in [0,1]; `statisticalUncertainty` is omitted (not applicable at
//   this level per Phase P2 scope).
//
// `NsclcRecommendationConclusion` — domain-specific payload placed in
//   `RecommendationObject.conclusion` (CC §27 / ADR-0001: RISX-Common owns
//   the result envelope; the clinical domain payload is opaque to it).
//   Previously the provisional local `RecommendationObject`; renamed in Stage
//   C to make the envelope / conclusion split explicit.
// ---------------------------------------------------------------------------

export interface RegimenCandidate {
  readonly regimenId: string;
  readonly therapies: ReadonlyArray<string>;
  readonly lineOfTherapy: number;
  readonly evidenceStrength: string;
  readonly excludedByContraindication: boolean;
  readonly contraindicationReasons: ReadonlyArray<string>;
  readonly confidence: TypedConfidence;
}

export interface NsclcRecommendationConclusion {
  readonly recommendationId: string;
  readonly rankedRegimens: ReadonlyArray<RegimenCandidate>;
  readonly intendedUsePosture: IntendedUse;
}

export interface ExecutionResult {
  readonly clinicalResult: ClinicalResult;
  readonly audit: AuditObject;
}

// ---------------------------------------------------------------------------
// Typed accessor: extracts the NSCLC domain conclusion from a sealed
// ClinicalResult (double-unwrap through the envelope chain:
//   ClinicalResult.conclusion → RecommendationObject →
//   RecommendationObject.conclusion → NsclcRecommendationConclusion).
// Use in tests and any caller that needs the domain-specific ranked regimens.
// ---------------------------------------------------------------------------

export function extractNsclcConclusion(result: ClinicalResult): NsclcRecommendationConclusion {
  return (result.conclusion as RecommendationObject).conclusion as NsclcRecommendationConclusion;
}
