import { describe, expect, it } from "vitest";
import { AnalyticsRuntime } from "../src/analyticsRuntime.js";
import { verifyReplay, ReplayDivergenceError } from "../src/auditReplay.js";
import { BASE_EXECUTION_CONTEXT, egfrPositiveStageIVInputs } from "./fixtures.js";
import { admitCanonicalInputs, CanonicalInputRejectedError } from "../src/canonicalInputGateway.js";
import { StagingValidationError } from "../src/modules/staging.js";

describe("Analytics Runtime — end-to-end NSCLC clinical reasoning (Phase P2 Mechanical Spine)", () => {
  it("produces the guideline-matched, evidence-cited EGFR recommendation for a Stage IV EGFR-positive patient", () => {
    const runtime = new AnalyticsRuntime();
    const { clinicalResult, audit } = runtime.execute({
      canonicalInputs: egfrPositiveStageIVInputs(),
      executionContext: BASE_EXECUTION_CONTEXT
    });

    expect(clinicalResult.recommendation.rankedRegimens[0]?.regimenId).toBe("osimertinib-monotherapy");
    expect(clinicalResult.recommendation.rankedRegimens[0]?.excludedByContraindication).toBe(false);
    expect(clinicalResult.warnings).toHaveLength(0);
    expect(audit.moduleSet.map((m) => m.moduleId)).toEqual([
      "staging-module",
      "biomarker-interpretation-module",
      "guideline-matching-module",
      "regimen-selection-module",
      "recommendation-generation-module"
    ]);
    expect(audit.evidenceSnapshot.map((p) => p.packageId).sort()).toEqual(
      ["ajcc-staging-manual", "biomarker-definitions", "fda-drug-labels-nsclc", "nccn-nsclc-guidelines"].sort()
    );
    expect(audit.resolvedConflicts).toHaveLength(0);
  });

  it("excludes osimertinib when an active strong CYP3A4 inducer is on the medication list, with the reason recorded", () => {
    const runtime = new AnalyticsRuntime();
    const inputs = egfrPositiveStageIVInputs().map((c) =>
      c.id === "medication-1"
        ? { ...c, payload: { patientId: "patient-1", medicationCode: "STRONG-CYP3A4-INDUCER", status: "active" } }
        : c
    );
    const { clinicalResult } = runtime.execute({ canonicalInputs: inputs, executionContext: BASE_EXECUTION_CONTEXT });
    const osimertinibCandidate = clinicalResult.recommendation.rankedRegimens.find(
      (r) => r.regimenId === "osimertinib-monotherapy"
    );
    expect(osimertinibCandidate?.excludedByContraindication).toBe(true);
    expect(osimertinibCandidate?.contraindicationReasons.length).toBeGreaterThan(0);
  });

  it("surfaces an unmapped biomarker result as unclassified rather than silently dropping it", () => {
    const runtime = new AnalyticsRuntime();
    const inputs = egfrPositiveStageIVInputs().map((c) =>
      c.id === "biomarker-result-1"
        ? { ...c, payload: { diagnosisId: "diagnosis-1", assayId: "ngs-panel-1", rawResultCode: "UNKNOWN-MARKER-X", resultDateIso: "2026-06-02T00:00:00.000Z" } }
        : c
    );
    const { clinicalResult } = runtime.execute({ canonicalInputs: inputs, executionContext: BASE_EXECUTION_CONTEXT });
    expect(clinicalResult.warnings.some((w) => w.includes("could not be classified"))).toBe(true);
    // With no actionable biomarker, the guideline-agnostic default regimen should be recommended instead.
    expect(clinicalResult.recommendation.rankedRegimens[0]?.regimenId).toBe("carboplatin-pemetrexed-pembrolizumab");
  });

  it("rejects at the Canonical Input Gateway boundary rather than reaching any module (GR-32 admission discipline)", () => {
    const runtime = new AnalyticsRuntime();
    const inputs = egfrPositiveStageIVInputs().map((c) =>
      c.id === "ecog-1" ? { ...c, payload: { patientId: "patient-1", ecogScore: 7, assessmentDateIso: "2026-06-01T00:00:00.000Z" } } : c
    );
    expect(() => runtime.execute({ canonicalInputs: inputs as any, executionContext: BASE_EXECUTION_CONTEXT })).toThrow(
      CanonicalInputRejectedError
    );
  });

  it("fails as a validation error, never a best-guess default, when T/N/M is not covered by the pinned AJCC edition", () => {
    const runtime = new AnalyticsRuntime();
    const inputs = egfrPositiveStageIVInputs().map((c) =>
      c.id === "disease-stage-1" ? { ...c, payload: { diagnosisId: "diagnosis-1", tCategory: "T1", nCategory: "N0", mCategory: "M0" } } : c
    );
    expect(() => runtime.execute({ canonicalInputs: inputs, executionContext: BASE_EXECUTION_CONTEXT })).toThrow(
      StagingValidationError
    );
  });

  it("is a pure function of its inputs: two identical executions produce bit-identical result and confidence hashes", () => {
    const runtime = new AnalyticsRuntime();
    const first = runtime.execute({ canonicalInputs: egfrPositiveStageIVInputs(), executionContext: BASE_EXECUTION_CONTEXT });
    const second = runtime.execute({ canonicalInputs: egfrPositiveStageIVInputs(), executionContext: BASE_EXECUTION_CONTEXT });
    expect(first.audit.resultHashes.recommendationHash.digest).toBe(second.audit.resultHashes.recommendationHash.digest);
    expect(first.audit.resultHashes.confidenceHash.digest).toBe(second.audit.resultHashes.confidenceHash.digest);
  });
});

describe("Audit & Replay Subsystem — deterministic replay (GR-28, GR-29, Section 37 acceptance criterion)", () => {
  it("replays bit-for-bit identical from the sealed Audit Object and the original canonical inputs", () => {
    const runtime = new AnalyticsRuntime();
    const inputs = egfrPositiveStageIVInputs();
    const { clinicalResult, audit } = runtime.execute({ canonicalInputs: inputs, executionContext: BASE_EXECUTION_CONTEXT });

    // Simulate a real replay: reconstruct the run from the recorded audit and
    // the archived original canonical inputs (see auditReplay.ts file header
    // for why RISX-Core accepts inputs explicitly rather than archiving them
    // itself).
    const replayRuntime = new AnalyticsRuntime();
    const replayed = replayRuntime.execute({ canonicalInputs: inputs, executionContext: BASE_EXECUTION_CONTEXT });

    const result = verifyReplay(audit, {
      canonicalInputs: admitForFingerprint(inputs),
      recommendation: replayed.clinicalResult.recommendation,
      aggregateConfidence: replayed.clinicalResult.confidence
    });

    expect(result.identical).toBe(true);
    expect(replayed.audit.resultHashes.recommendationHash.digest).toBe(audit.resultHashes.recommendationHash.digest);
    expect(replayed.clinicalResult.recommendation).toEqual(clinicalResult.recommendation);
  });

  it("surfaces replay divergence as a defect rather than reconciling, when the recomputed result differs (GR-29)", () => {
    const runtime = new AnalyticsRuntime();
    const { audit } = runtime.execute({ canonicalInputs: egfrPositiveStageIVInputs(), executionContext: BASE_EXECUTION_CONTEXT });

    const divergentRecommendation = {
      recommendationId: "rec-tampered",
      rankedRegimens: [],
      intendedUsePosture: BASE_EXECUTION_CONTEXT.intendedUsePosture
    };

    expect(() =>
      verifyReplay(audit, {
        canonicalInputs: admitForFingerprint(egfrPositiveStageIVInputs()),
        recommendation: divergentRecommendation,
        aggregateConfidence: {
          evidenceStrength: 0,
          applicability: 0,
          sourceAgreement: 0,
          statisticalUncertainty: null,
          aggregationPolicyVersion: "tampered"
        }
      })
    ).toThrow(ReplayDivergenceError);
  });
});

// Mirrors AnalyticsRuntime's internal ADMIT-phase fingerprint derivation so
// the test can independently recompute a fingerprint from raw inputs, the
// way an external replay caller (e.g. Studio) would.
function admitForFingerprint(
  inputs: ReturnType<typeof egfrPositiveStageIVInputs>
): ReadonlyArray<readonly [string, unknown]> {
  const admitted = admitCanonicalInputs(inputs);
  return [...admitted.entries()];
}
