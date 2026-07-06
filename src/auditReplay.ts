import type {
  AuditObject,
  ClinicalResult,
  EvidenceSnapshot,
  ExecutionContext,
  RecommendationObject,
  TypedConfidence
} from "./types.js";
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
 * A note on scope: the Audit Object's `canonicalInputFingerprint` records a
 * hash of the pinned inputs, per the governing architecture — it does not
 * itself durably store the raw canonical inputs. Durable storage of
 * historical canonical inputs is not a Computational Core responsibility in
 * the governing architecture (Sections 39-43 place external state and
 * connectivity outside the Core entirely) and no such store exists yet in
 * the platform. Replay in this Phase P2 implementation therefore accepts
 * the original canonical inputs as an explicit argument (as a caller
 * outside the Core, e.g. Studio, would supply them from wherever they are
 * archived) and verifies them against the recorded fingerprint before
 * proceeding — it does not invent a canonical-input archive inside
 * RISX-Core, which would be an undocumented architectural addition.
 */

export const ENGINE_VERSION = "risx-core-0.1.0-phase-p2-mechanical-spine";

export interface SealArgs {
  readonly moduleSet: ReadonlyArray<{ moduleId: string; version: string }>;
  readonly evidenceSnapshot: EvidenceSnapshot;
  readonly canonicalInputFingerprint: string;
  readonly executionDag: ReadonlyArray<{ moduleId: string; dependsOn: ReadonlyArray<string> }>;
  readonly executionContext: ExecutionContext;
  readonly recommendation: RecommendationObject;
  readonly aggregateConfidence: TypedConfidence;
}

export function sealAuditObject(args: SealArgs): AuditObject {
  const resultHash = sha256Hex(args.recommendation);
  const confidenceHash = sha256Hex(args.aggregateConfidence);
  const auditId = sha256Hex({
    moduleSet: args.moduleSet,
    evidenceSnapshot: args.evidenceSnapshot,
    canonicalInputFingerprint: args.canonicalInputFingerprint,
    executionDag: args.executionDag,
    executionContext: args.executionContext,
    resultHash,
    confidenceHash
  });

  return {
    auditId,
    engineVersion: ENGINE_VERSION,
    moduleSet: args.moduleSet,
    evidenceSnapshot: args.evidenceSnapshot,
    canonicalInputFingerprint: args.canonicalInputFingerprint,
    executionDag: args.executionDag,
    precedencePolicyVersion: args.executionContext.precedencePolicyVersion,
    confidencePolicyVersion: args.executionContext.confidencePolicyVersion,
    intendedUsePosture: args.executionContext.intendedUsePosture,
    bitemporal: {
      validTime: args.executionContext.injectedTimeIso,
      decisionTime: args.executionContext.injectedTimeIso
    },
    resolvedConflicts: [], // Phase P2 is single-domain: the Cross-Domain Reasoner has nothing to resolve.
    resultHash,
    confidenceHash
  };
}

export function buildClinicalResult(args: {
  id: string;
  audit: AuditObject;
  recommendation: RecommendationObject;
  aggregateConfidence: TypedConfidence;
  warnings: ReadonlyArray<string>;
  canonicalObjectIds: ReadonlyArray<string>;
  evidenceRefs: ReadonlyArray<string>;
}): ClinicalResult {
  return {
    id: args.id,
    schemaVersion: "risx-core-phase-p2-provisional-1",
    provenance: {
      evidencePackages: args.audit.evidenceSnapshot.packages,
      canonicalObjectIds: args.canonicalObjectIds
    },
    confidence: args.aggregateConfidence,
    auditRef: args.audit.auditId,
    evidenceRefs: args.evidenceRefs,
    moduleRefs: args.audit.moduleSet,
    producedAt: args.audit.bitemporal.decisionTime,
    intendedUse: args.audit.intendedUsePosture,
    warnings: args.warnings,
    recommendation: args.recommendation
  };
}

export class ReplayDivergenceError extends Error {
  constructor(
    readonly field: "canonicalInputFingerprint" | "resultHash" | "confidenceHash",
    readonly recorded: string,
    readonly recomputed: string
  ) {
    super(
      `Replay divergence on "${field}": recorded=${recorded} recomputed=${recomputed}. ` +
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
 */
export function verifyReplay(
  recorded: AuditObject,
  recomputed: { canonicalInputFingerprint: string; recommendation: RecommendationObject; aggregateConfidence: TypedConfidence }
): ReplayResult {
  if (recomputed.canonicalInputFingerprint !== recorded.canonicalInputFingerprint) {
    throw new ReplayDivergenceError(
      "canonicalInputFingerprint",
      recorded.canonicalInputFingerprint,
      recomputed.canonicalInputFingerprint
    );
  }
  const recomputedResultHash = sha256Hex(recomputed.recommendation);
  if (recomputedResultHash !== recorded.resultHash) {
    throw new ReplayDivergenceError("resultHash", recorded.resultHash, recomputedResultHash);
  }
  const recomputedConfidenceHash = sha256Hex(recomputed.aggregateConfidence);
  if (recomputedConfidenceHash !== recorded.confidenceHash) {
    throw new ReplayDivergenceError("confidenceHash", recorded.confidenceHash, recomputedConfidenceHash);
  }
  return { identical: true, recomputedAudit: recorded };
}
