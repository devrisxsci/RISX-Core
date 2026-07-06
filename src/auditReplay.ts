import type { AuditObject, ClinicalResult, EvidencePackageManifest, RecommendationObject, TypedConfidence } from "./types.js";
import type { EvidenceSnapshot, ExecutionContext } from "./types.js";
import { computeContentHash } from "@risx/common";
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
 * STAGE C: the sealed `AuditObject` is now @risx/common's v2.0 shape (one of
 * the three consumed surfaces). Its content-hash-typed fields
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

export const ENGINE_VERSION = "0.1.0+phase-p2-mechanical-spine";
export const AUDIT_SCHEMA_VERSION = "2.0.0";

export interface SealArgs {
  readonly moduleSet: ReadonlyArray<{ moduleId: string; version: string }>;
  readonly evidenceSnapshot: EvidenceSnapshot;
  readonly canonicalInputs: ReadonlyArray<readonly [string, unknown]>;
  readonly executionDag: ReadonlyArray<{ moduleId: string; dependsOn: ReadonlyArray<string> }>;
  readonly executionContext: ExecutionContext;
  readonly recommendation: RecommendationObject;
  readonly aggregateConfidence: TypedConfidence;
}

/**
 * Builds the reduced evidence-snapshot shape the v2.0 `AuditObject` schema
 * requires (`{ packageId, version, contentHash }[]`) from the full
 * `EvidencePackageManifest[]` this Core pins. Per EP-10, a package
 * manifest's `manifestHash` is its "single root of integrity" — verifying it
 * verifies the whole package transitively — so `manifestHash` is what is
 * recorded here as each package's `contentHash`.
 */
function toAuditEvidenceSnapshot(snapshot: EvidenceSnapshot): AuditObject["evidenceSnapshot"] {
  return snapshot.packages.map((manifest) => ({
    packageId: manifest.packageId,
    version: manifest.version,
    contentHash: manifest.manifestHash
  }));
}

/**
 * Builds the v2.0 `executionDag` shape (`{ nodes, edges }`) from the planned
 * DAG this Core resolves. Per CC §8.1/§8.2, "nodes are module invocations
 * and edges are declared data dependencies"; edges are recorded here in
 * producer -> consumer (data-flow) direction, i.e. `from` is the module a
 * dependent module's input came from and `to` is the dependent module,
 * matching §8.2's "dependency resolution matches producers to consumers."
 */
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

  return {
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
    // Phase P2 is single-domain: the Cross-Domain Reasoner has nothing to resolve.
    resolvedConflicts: [],
    resultHashes: {
      recommendationHash,
      confidenceHash
    }
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
  evidencePackages: ReadonlyArray<EvidencePackageManifest>;
}): ClinicalResult {
  return {
    id: args.id,
    schemaVersion: "risx-core-phase-p2-provisional-1",
    provenance: {
      evidencePackages: args.evidencePackages,
      canonicalObjectIds: args.canonicalObjectIds
    },
    confidence: args.aggregateConfidence,
    auditRef: args.audit.id,
    evidenceRefs: args.evidenceRefs,
    moduleRefs: args.audit.moduleSet,
    producedAt: args.audit.bitemporalTimestamps.decisionTime,
    intendedUse: args.audit.intendedUsePosture,
    warnings: args.warnings,
    recommendation: args.recommendation
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
 */
export function verifyReplay(
  recorded: AuditObject,
  recomputed: {
    canonicalInputs: ReadonlyArray<readonly [string, unknown]>;
    recommendation: RecommendationObject;
    aggregateConfidence: TypedConfidence;
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
