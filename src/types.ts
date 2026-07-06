/**
 * RISX-Core — Provisional local types (Phase P2, Mechanical Spine).
 *
 * IMPORTANT — PROVISIONAL SCOPE NOTE (read before extending):
 * ADR-0001 (RISX-Architecture) records that no repository has yet been approved
 * to own the schema for domain-specific Canonical Objects, and ADR-0002 records
 * that the aggregate-confidence computation rule is still open. Both are STOP-and-
 * ADR items in the governing architecture, not decisions this implementation may
 * make on the platform's behalf.
 *
 * `devrisxsci/RISX-Common` DOES exist and DOES ratify (under IA-001A) shared
 * `TypedConfidence` / `AuditObject` / `ClinicalResult` / `RecommendationObject`
 * contracts that RISX-Core is architecturally required to depend on instead of
 * defining its own. Those ratified contracts were inspected during this
 * implementation and found to be structurally incompatible with what the
 * Computational Core architecture and the NSCLC Knowledge Slice v1.1 require
 * for this exact use case — see docs/ARCHITECTURAL_ISSUES.md, finding 3, for
 * the field-by-field conflict (single-scalar vs. four-dimension confidence;
 * generic action-log vs. execution-sealing audit object; no sanctioned place
 * for a domain payload on the shared result envelopes). Importing them as-is
 * would silently pick a winner between two ratified-but-conflicting
 * specifications, which this implementation is not authorized to do.
 *
 * Everything in this file is therefore a LOCAL, PROVISIONAL representation,
 * scoped only to exercising the RISX-Core Mechanical Spine end-to-end for the
 * NSCLC Enterprise Knowledge Slice. None of it claims to be the RISX-Common
 * contract, and none of it proposes to override RISX-Common. Once an ADR
 * reconciles the conflict described above (and, separately, once ADR-0001
 * resolves domain-specific Canonical Object ownership), these types should be
 * replaced by imports from RISX-Common, not extended in place. This is
 * documented, not silent, per IA-003's Stop Conditions.
 */

// ---------------------------------------------------------------------------
// RISX Canonical Object envelope (provisional — see file header)
// ---------------------------------------------------------------------------

export interface CanonicalObjectEnvelope<TPayload = unknown> {
  readonly canonicalObjectType: string;
  readonly id: string;
  readonly payload: TPayload;
}

// ---------------------------------------------------------------------------
// Typed confidence (RISX-Common concept, Section 26 of the Computational Core
// architecture) — dimensions are structural per the governing architecture;
// the aggregation RULE across dimensions is intentionally left as the simplest
// documented, versioned, and provisional rule pending ADR-0002.
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
// ---------------------------------------------------------------------------

export interface ExecutionContext {
  readonly injectedTimeIso: string;
  readonly randomSeed: string;
  readonly tenantId: string;
  readonly precedencePolicyVersion: string;
  readonly confidencePolicyVersion: string;
  readonly intendedUsePosture: string;
}

// ---------------------------------------------------------------------------
// Evidence Package manifest (Evidence Package Specification, Sections 14-19)
// — simplified to the fields RISX-Core needs to pin and cite a package. There
// is no Knowledge Compiler or digital signature authority in this phase, so
// packages here are fixtures with a real content hash but no signature chain;
// this is documented as a Phase P2 simplification, not a claim of full EP-13
// conformance (which requires a trusted publisher that does not exist yet).
// ---------------------------------------------------------------------------

export interface EvidencePackageManifest {
  readonly packageId: string;
  readonly version: string;
  readonly source: string;
  readonly contentHash: string;
}

export interface EvidenceAssertion<TClaim = unknown> {
  readonly assertionId: string;
  readonly evidenceCategory: string;
  readonly claim: TClaim;
  readonly citation: string;
}

export interface EvidencePackage<TClaim = unknown> {
  readonly manifest: EvidencePackageManifest;
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
// Recommendation / Audit envelopes (Sections 27, 34) — provisional local
// shape of RISX-Common's ClinicalResult / RecommendationObject / AuditObject.
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
  readonly intendedUsePosture: string;
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
  readonly intendedUse: string;
  readonly warnings: ReadonlyArray<string>;
  readonly recommendation: RecommendationObject;
}

export interface ResolvedConflict {
  readonly spineKey: string;
  readonly competitors: ReadonlyArray<string>;
  readonly precedencePolicyVersion: string;
  readonly winner: string;
}

export interface AuditObject {
  readonly auditId: string;
  readonly engineVersion: string;
  readonly moduleSet: ReadonlyArray<{ moduleId: string; version: string }>;
  readonly evidenceSnapshot: EvidenceSnapshot;
  readonly canonicalInputFingerprint: string;
  readonly executionDag: ReadonlyArray<{ moduleId: string; dependsOn: ReadonlyArray<string> }>;
  readonly precedencePolicyVersion: string;
  readonly confidencePolicyVersion: string;
  readonly intendedUsePosture: string;
  readonly bitemporal: { readonly validTime: string; readonly decisionTime: string };
  readonly resolvedConflicts: ReadonlyArray<ResolvedConflict>;
  readonly resultHash: string;
  readonly confidenceHash: string;
}

export interface ExecutionResult {
  readonly clinicalResult: ClinicalResult;
  readonly audit: AuditObject;
}
