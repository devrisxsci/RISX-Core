/**
 * RISX-Core — types (Phase P2, Mechanical Spine).
 *
 * STAGE C SCOPE NOTE (revised, PO-approved):
 * `devrisxsci/RISX-Common` v2.0 is now consumed for exactly three
 * unentangled surfaces: `AuditObject`, `EvidencePackageManifest`, and
 * `IntendedUse` (imported below from "@risx/common"). These three surfaces
 * were confirmed to have no dependency on `TypedConfidence` and were
 * verified structurally compatible with what this Mechanical Spine
 * implementation and the NSCLC Knowledge Slice v1.1 require.
 *
 * `ClinicalResult`, `RecommendationObject`, `TypedConfidence`, and
 * `ModuleDefinition` remain LOCAL, PROVISIONAL types below and are HELD
 * pending ADRs: RISX-Common's `ClinicalResult`/`RecommendationObject` are
 * built on `ModuleResultBaseSchema`, which requires a `TypedConfidence`
 * field that is not itself isolatable from those two result envelopes
 * without also resolving the same single-scalar-vs-four-dimension
 * confidence conflict recorded in the prior stage's findings. That
 * dependency is not touched in this stage — see docs/ARCHITECTURAL_ISSUES.md,
 * finding 3, for the original field-by-field analysis (still applicable to
 * these four held types), and the Stage C commit message for exactly which
 * types are held and why.
 */

import type { AuditObject, EvidencePackageManifest, IntendedUse } from "@risx/common";

export type { AuditObject, EvidencePackageManifest, IntendedUse };

// ---------------------------------------------------------------------------
// RISX Canonical Object envelope (provisional — see file header)
// ---------------------------------------------------------------------------

export interface CanonicalObjectEnvelope<TPayload = unknown> {
  readonly canonicalObjectType: string;
  readonly id: string;
  readonly payload: TPayload;
}

// ---------------------------------------------------------------------------
// Typed confidence (HELD — see file header). RISX-Common concept, Section 26
// of the Computational Core architecture) — dimensions are structural per
// the governing architecture; the aggregation RULE across dimensions is
// intentionally left as the simplest documented, versioned, and provisional
// rule pending ADR-0002.
// ---------------------------------------------------------------------------

export interface TypedConfidence {
  readonly evidenceStrength: number; // [0,1]
  readonly applicability: number; // [0,1]
  readonly sourceAgreement: number; // [0,1]
  readonly statisticalUncertainty: number | null; // [0,1] or not applicable
  readonly aggregationPolicyVersion: string;
}

// ---------------------------------------------------------------------------
// Execution context (Section 5.2) — every value that could otherwise vary
// between two identical executions is carried explicitly here.
// `intendedUsePosture` is now typed against @risx/common's `IntendedUse`
// (one of the three consumed surfaces).
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
// Evidence Package (Evidence Package Specification, Sections 14-19) — the
// manifest shape is now @risx/common's `EvidencePackageManifest` (one of the
// three consumed surfaces). There is still no Knowledge Compiler or digital
// signature authority in this phase, so packages here are fixtures with a
// real hash tree but a placeholder signature; this is documented as a Phase
// P2 simplification, not a claim of full EP-13 conformance (which requires a
// trusted publisher that does not exist yet).
//
// `source` is a Core-local field describing the fixture's provenance (e.g.
// "AJCC/UICC"). It is NOT part of the @risx/common `EvidencePackageManifest`
// schema (which has no such field), so it is carried on the Core-local
// `EvidencePackage` wrapper instead of being smuggled into the manifest.
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

// Pinned snapshot: exact package versions + hashes an execution reasons over.
export interface EvidenceSnapshot {
  readonly packages: ReadonlyArray<EvidencePackageManifest>;
}

// ---------------------------------------------------------------------------
// Module contract (Sections 10-11) — language-neutral in the governing
// architecture; expressed here as a same-process TypeScript contract because
// Phase P2 implements only the Clinical domain in one repository. Crossing a
// real wire boundary is not required to prove the mechanical spine and is not
// introduced here (see docs/PHASE_P2_SCOPE.md).
//
// `ModuleDefinition` (RISX-Common's manifest for a registered module) is
// HELD — see file header — so `ModuleRegistration` below remains the local,
// provisional module contract shape, unchanged from the prior stage.
// ---------------------------------------------------------------------------

export interface ModuleRegistration<TInputs, TOutput> {
  readonly moduleId: string;
  readonly version: string;
  readonly domain: string;
  readonly declaredInputs: ReadonlyArray<string>;
  readonly declaredOutputs: string;
  readonly confidenceProfile: ReadonlyArray<keyof TypedConfidence>;
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
// Recommendation / Clinical Result envelopes (Sections 27, 34) — HELD, see
// file header: RISX-Common's `RecommendationObject` and `ClinicalResult` are
// entangled with `TypedConfidence` via `ModuleResultBaseSchema` and are not
// isolatable in this stage. These remain the local, provisional shapes,
// unchanged from the prior stage.
//
// `AuditObject` below is no longer defined locally — it is imported from
// "@risx/common" above (one of the three consumed surfaces) and used
// directly by `ExecutionResult`.
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

export interface RecommendationObject {
  readonly recommendationId: string;
  readonly rankedRegimens: ReadonlyArray<RegimenCandidate>;
  readonly intendedUsePosture: IntendedUse;
}

export interface ClinicalResult {
  readonly id: string;
  readonly schemaVersion: string;
  readonly provenance: {
    readonly evidencePackages: ReadonlyArray<EvidencePackageManifest>;
    readonly canonicalObjectIds: ReadonlyArray<string>;
  };
  readonly confidence: TypedConfidence;
  readonly auditRef: string;
  readonly evidenceRefs: ReadonlyArray<string>;
  readonly moduleRefs: ReadonlyArray<{ moduleId: string; version: string }>;
  readonly producedAt: string;
  readonly intendedUse: IntendedUse;
  readonly warnings: ReadonlyArray<string>;
  readonly recommendation: RecommendationObject;
}

export interface ExecutionResult {
  readonly clinicalResult: ClinicalResult;
  readonly audit: AuditObject;
}
