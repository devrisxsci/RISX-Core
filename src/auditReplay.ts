import type { AuditObject, ClinicalResult, RecommendationObject, TypedConfidence, IntendedUse, NsclcRecommendationConclusion } from "./types.js";
import type { EvidenceSnapshot, ExecutionContext } from "./types.js";
import { AuditObjectSchema, computeContentHash } from "@risx/common";
import { sha256Hex } from "./hash.js";

/**
 * Audit & Replay Subsystem (Computational Core architecture, Sections 34-38).
 *
 * "Every execution produces an Audit Object that captures everything
 * required to reproduce the result exactly" (GR-28). This module seals that
 * object and validates replay by bit-for-bit hash comparison (GR-29): "if a
 * replay produces a different result than the record, the platform does not
 * average, prefer, or reconcile the two. It fails and surfaces the
 * divergence as a defect."
 *
 * STAGE C: the sealed `AuditObject` is now @risx/common's v2.0 shape (one
 * of the three consumed surfaces). Its content-hash-typed fields
 * (`canonicalInputFingerprint`, `evidenceSnapshot[].contentHash`,
 * `resultHashes.*`) are populated with @risx/common's `computeContentHash`,
 * which canonicalizes and hashes exactly like this file's existing
 * `sha256Hex` helper (sorted-key JSON + SHA-256 hex digest) — the two are
 * interchangeable in effect, but `computeContentHash` is used here to
 * produce a real `ContentHash` object (`{ algorithm, digest }`) rather than
 * a bare string, since that is what the v2.0 schema requires. `sha256Hex` is
 * still used below for the audit `id`, which the schema types only as
 * `z.string().min(1)`, not as a `ContentHash`.
 *
 * STAGE C (final batch): `SealArgs.recommendation` is now typed as
 * `NsclcRecommendationConclusion` — the Core-local domain payload (ranked
 * regimens etc.) — rather than the full RISX-Common `RecommendationObject`
 * envelope. This correctly hashes "what was decided" (the domain conclusion),
 * not the envelope metadata derived from it. `buildRecommendationObject`
 * wraps the conclusion into the RISX-Common envelope after the audit is
 * sealed. `buildClinicalResult` now produces a conformant RISX-Common
 * `ClinicalResult` with proper `objectType`, `schemaVersion`, `provenance`
 * (using RISX-Common's concrete `Provenance` shape), and `moduleRefs` as
 * a `string[]` of module IDs (not objects), with the `RecommendationObject`
 * placed in `conclusion: unknown` per CC §27/ADR-0001.
 *
 * See auditReplay.ts file header (original) for the note on why canonical
 * inputs are accepted as an explicit argument to `verifyReplay` rather than
 * being archived inside RISX-Core itself.
 */

export const ENGINE_VERSION = "0.1.0+phase-p2-mechanical-spine";
export const AUDIT_SCHEMA_VERSION = "2.0.0";

export interface SealArgs {
  readonly moduleSet: ReadonlyArray<{ moduleId: string; version: string }>;
  readonly evidenceSnapshot: EvidenceSnapshot;
  readonly canonicalInputs: ReadonlyArray<readonly [string, unknown]>;
  readonly executionDag: ReadonlyArray<{ moduleId: string; dependsOn: ReadonlyArray<string> }>;
  readonly executionContext: ExecutionContext;
  /** The domain-specific conclusion hashed into the audit (not the full RISX-Common envelope). */
  readonly recommendation: NsclcRecommendationConclusion;
  readonly aggregateConfidence: TypedConfidence;
}

function toAuditEvidenceSnapshot(snapshot: EvidenceSnapshot): AuditObject["evidenceSnapshot"] {
  return snapshot.packages.map((manifest) => ({
    packageId: manifest.packageId,
    version: manifest.version,
    contentHash: manifest.manifestHash
  }));
}

function toAuditExecutionDag(
  moduleSet: ReadonlyArray<{ moduleId: string; version: string }>,
  executionDag: ReadonlyArray<{ moduleId: string; dependsOn: ReadonlyArray<string> }>
): AuditObject["executionDag"] {
  const versionByModuleId = new Map(moduleSet.map((m) => [m.moduleId, m.version]));
  const nodes = executionDag.map((n) => ({
    moduleId: n.moduleId,
    version: versionByModuleId.get(n.moduleId) ?? "0.0.0"
  }));
  const edges: Array<{ from: string; to: string }> = [];
  for (const n of executionDag) {
    for (const dep of n.dependsOn) {
      edges.push({ from: dep, to: n.moduleId });
    }
  }
  return { nodes, edges };
}

export function sealAuditObject(args: SealArgs): AuditObject {
  const canonicalInputFingerprint = computeContentHash(
    [...args.canonicalInputs].sort(([a], [b]) => a.localeCompare(b))
  );
  const recommendationHash = computeContentHash(args.recommendation);
  const confidenceHash = computeContentHash(args.aggregateConfidence);
  const id = sha256Hex({
    moduleSet: args.moduleSet,
    evidenceSnapshot: args.evidenceSnapshot,
    canonicalInputFingerprint,
    executionDag: args.executionDag,
    executionContext: args.executionContext,
    recommendationHash,
    confidenceHash
  });

  const auditObject: AuditObject = {
    id,
    objectType: "AuditObject",
    schemaVersion: AUDIT_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    moduleSet: [...args.moduleSet],
    evidenceSnapshot: toAuditEvidenceSnapshot(args.evidenceSnapshot),
    canonicalInputFingerprint,
    executionDag: toAuditExecutionDag(args.moduleSet, args.executionDag),
    precedencePolicyVersion: args.executionContext.precedencePolicyVersion,
    confidencePolicyVersion: args.executionContext.confidencePolicyVersion,
    intendedUsePosture: args.executionContext.intendedUsePosture,
    bitemporalTimestamps: {
      validTime: args.executionContext.injectedTimeIso,
      decisionTime: args.executionContext.injectedTimeIso
    },
    resolvedConflicts: [],
    resultHashes: {
      recommendationHash,
      confidenceHash
    }
  };

  return AuditObjectSchema.parse(auditObject);
}

/**
 * Wraps a `NsclcRecommendationConclusion` (Core-local domain payload) in the
 * RISX-Common `RecommendationObject` envelope (CC §27 / ADR-0001). Called
 * after `sealAuditObject` so that `auditRef` can be populated from the sealed
 * audit's id.
 */
export function buildRecommendationObject(args: {
  readonly nsclcConclusion: NsclcRecommendationConclusion;
  readonly aggregateConfidence: TypedConfidence;
  readonly auditRef: string;
  readonly evidenceRefs: ReadonlyArray<string>;
  readonly moduleRefs: ReadonlyArray<string>;
  readonly producedAt: string;
  readonly intendedUse: IntendedUse;
  readonly warnings: ReadonlyArray<string>;
}): RecommendationObject {
  return {
    id: args.nsclcConclusion.recommendationId,
    objectType: "RecommendationObject",
    schemaVersion: "2.0.0",
    provenance: {
      sourceSystem: "risx-core-phase-p2",
      documentId: args.nsclcConclusion.recommendationId,
      extractionMethod: "deterministic-rule-engine",
      recordedAt: args.producedAt
    },
    confidence: args.aggregateConfidence,
    auditRef: args.auditRef,
    evidenceRefs: [...args.evidenceRefs],
    moduleRefs: [...args.moduleRefs],
    producedAt: args.producedAt,
    intendedUse: args.intendedUse,
    warnings: [...args.warnings],
    conclusion: args.nsclcConclusion,
    resolvedConflicts: []
  };
}

/**
 * Assembles the RISX-Common `ClinicalResult` envelope from the sealed audit
 * and the fully-wrapped `RecommendationObject`. The recommendation is placed
 * in `conclusion: unknown` per CC §27 / ADR-0001 (RISX-Common owns the
 * envelope; the clinical domain payload is opaque to it). `moduleRefs` are
 * module IDs (strings), not objects. `provenance` uses the concrete
 * RISX-Common `Provenance` shape (sourceSystem, documentId, extractionMethod,
 * recordedAt).
 */
export function buildClinicalResult(args: {
  readonly id: string;
  readonly audit: AuditObject;
  readonly recommendation: RecommendationObject;
  readonly aggregateConfidence: TypedConfidence;
  readonly warnings: ReadonlyArray<string>;
  readonly canonicalObjectIds: ReadonlyArray<string>;
  readonly evidenceRefs: ReadonlyArray<string>;
}): ClinicalResult {
  return {
    id: args.id,
    objectType: "ClinicalResult",
    schemaVersion: "2.0.0",
    provenance: {
      sourceSystem: "risx-core-phase-p2",
      documentId: args.id,
      extractionMethod: "deterministic-rule-engine",
      recordedAt: args.audit.bitemporalTimestamps.decisionTime
    },
    confidence: args.aggregateConfidence,
    auditRef: args.audit.id,
    evidenceRefs: [...args.evidenceRefs],
    moduleRefs: args.audit.moduleSet.map((m) => m.moduleId),
    producedAt: args.audit.bitemporalTimestamps.decisionTime,
    intendedUse: args.audit.intendedUsePosture,
    warnings: [...args.warnings],
    conclusion: args.recommendation
  };
}

export class ReplayDivergenceError extends Error {
  constructor(
    readonly field: "canonicalInputFingerprint" | "recommendationHash" | "confidenceHash",
    readonly recorded: unknown,
    readonly recomputed: unknown
  ) {
    super(
      `Replay divergence on "${field}": recorded=${JSON.stringify(recorded)} recomputed=${JSON.stringify(recomputed)}. ` +
        `Per GR-29, this is surfaced as a defect and never reconciled.`
    );
    this.name = "ReplayDivergenceError";
  }
}

export interface ReplayResult {
  readonly identical: true;
  readonly recomputedAudit: AuditObject;
}

/**
 * Replays a sealed execution: re-derives the canonical input fingerprint
 * from the supplied original inputs and compares it to the recorded one,
 * then re-executes with the recorded module versions/evidence snapshot/
 * policy versions/context and compares the resulting hashes bit-for-bit.
 * Any divergence throws `ReplayDivergenceError` rather than reconciling.
 *
 * `recomputed.recommendation` is the `NsclcRecommendationConclusion` (the
 * domain payload that was hashed into the audit at seal time), not the full
 * RISX-Common `RecommendationObject` envelope.
 */
export function verifyReplay(
  recorded: AuditObject,
  recomputed: {
    readonly canonicalInputs: ReadonlyArray<readonly [string, unknown]>;
    readonly recommendation: NsclcRecommendationConclusion;
    readonly aggregateConfidence: TypedConfidence;
  }
): ReplayResult {
  const recomputedFingerprint = computeContentHash(
    [...recomputed.canonicalInputs].sort(([a], [b]) => a.localeCompare(b))
  );
  if (recomputedFingerprint.digest !== recorded.canonicalInputFingerprint.digest) {
    throw new ReplayDivergenceError(
      "canonicalInputFingerprint",
      recorded.canonicalInputFingerprint,
      recomputedFingerprint
    );
  }
  const recomputedRecommendationHash = computeContentHash(recomputed.recommendation);
  if (recomputedRecommendationHash.digest !== recorded.resultHashes.recommendationHash.digest) {
    throw new ReplayDivergenceError(
      "recommendationHash",
      recorded.resultHashes.recommendationHash,
      recomputedRecommendationHash
    );
  }
  const recomputedConfidenceHash = computeContentHash(recomputed.aggregateConfidence);
  if (recomputedConfidenceHash.digest !== recorded.resultHashes.confidenceHash.digest) {
    throw new ReplayDivergenceError(
      "confidenceHash",
      recorded.resultHashes.confidenceHash,
      recomputedConfidenceHash
    );
  }
  return { identical: true, recomputedAudit: recorded };
}
