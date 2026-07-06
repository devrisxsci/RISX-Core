import type { ModuleRegistration, ModuleRunContext, RegimenCandidate, RecommendationObject, TypedConfidence } from "../types.js";
import type { RegimenSelectionOutput } from "./regimenSelection.js";
import type { GuidelineMatchingOutput } from "./guidelineMatching.js";

/**
 * Recommendation Generation Module — NSCLC Knowledge Slice v1.1, Section 6.5.
 * Terminal module: consumes Regimen Selection + Guideline Matching outputs
 * only; reads no Evidence Package itself (Section 6.5, "does not re-read
 * Evidence Packages itself").
 * Deterministic processing order: 4 (terminal).
 *
 * Confidence aggregation: ADR-0002 (NSCLC spec, Section 12.2) records that
 * the aggregate-confidence computation rule across upstream dimensions is
 * still an OPEN architectural question, not yet decided by the governing
 * corpus. Per IA-003's Stop Conditions, this implementation does not decide
 * that question. It applies the simplest possible placeholder rule —
 * unweighted mean of the available [0,1] dimensions — clearly labeled with
 * an explicit `aggregationPolicyVersion` so it is versioned, replayable, and
 * trivially replaceable once ADR-0002 resolves, per GR-33's tolerance for
 * versioned, non-result-altering policy evolution.
 */

const CONFIDENCE_POLICY_VERSION = "provisional-unweighted-mean-v0-pending-ADR-0002";

function evidenceCategoryToStrengthScore(evidenceStrength: string): number {
  // NCCN Category 1 is the strongest guideline rating in this fixture set;
  // this mapping is local to Phase P2's fixtures, not a platform-wide scale.
  if (evidenceStrength === "NCCN-Category-1") return 1.0;
  return 0.5;
}

function aggregateConfidence(evidenceStrength: number, applicability: number, sourceAgreement: number): TypedConfidence {
  return {
    evidenceStrength,
    applicability,
    sourceAgreement,
    statisticalUncertainty: null,
    aggregationPolicyVersion: CONFIDENCE_POLICY_VERSION
  };
}

export interface RecommendationGenerationOutput {
  readonly recommendation: RecommendationObject;
}

export function runRecommendationGenerationModule(ctx: ModuleRunContext): RecommendationGenerationOutput {
  const regimenSelection = ctx.upstream.get("knowledge:RankedRegimen") as RegimenSelectionOutput | undefined;
  const guidelineMatching = ctx.upstream.get("knowledge:GuidelineMatch") as GuidelineMatchingOutput | undefined;
  if (!regimenSelection) {
    throw new Error("Recommendation Generation Module: upstream Regimen Selection Module output was not available.");
  }
  if (!guidelineMatching) {
    throw new Error("Recommendation Generation Module: upstream Guideline Matching Module output was not available.");
  }

  const eligible = regimenSelection.rankedRegimens.filter((r) => !r.excludedByContraindication);

  // Rank: strongest evidence first. On a strength tie, preserve the incoming
  // order from Guideline Matching (Section 6.3), which already orders
  // biomarker-specific decision points ahead of the biomarker-agnostic
  // default — Array.prototype.sort is a stable sort (ES2019+), so returning
  // 0 on a tie keeps that upstream ordering rather than re-deriving it here.
  const sorted = [...eligible].sort((a, b) => {
    return evidenceCategoryToStrengthScore(b.evidenceStrength) - evidenceCategoryToStrengthScore(a.evidenceStrength);
  });

  const candidates: RegimenCandidate[] = sorted.map((r) => ({
    regimenId: r.regimenId,
    therapies: r.therapies,
    lineOfTherapy: r.lineOfTherapy,
    evidenceStrength: r.evidenceStrength,
    excludedByContraindication: r.excludedByContraindication,
    contraindicationReasons: r.contraindicationReasons,
    confidence: aggregateConfidence(evidenceCategoryToStrengthScore(r.evidenceStrength), 1.0, 1.0)
  }));

  // Also surface excluded regimens for full explainability (Section 6.4
  // audit requirement: "record every Contraindication rule evaluated,
  // matched or not"), ranked after all eligible candidates.
  const excluded: RegimenCandidate[] = regimenSelection.rankedRegimens
    .filter((r) => r.excludedByContraindication)
    .map((r) => ({
      regimenId: r.regimenId,
      therapies: r.therapies,
      lineOfTherapy: r.lineOfTherapy,
      evidenceStrength: r.evidenceStrength,
      excludedByContraindication: r.excludedByContraindication,
      contraindicationReasons: r.contraindicationReasons,
      confidence: aggregateConfidence(evidenceCategoryToStrengthScore(r.evidenceStrength), 0, 1.0)
    }));

  return {
    recommendation: {
      recommendationId: `rec-${sorted.map((r) => r.regimenId).join("-") || "none"}`,
      rankedRegimens: [...candidates, ...excluded],
      intendedUsePosture: ctx.executionContext.intendedUsePosture
    }
  };
}

export const recommendationGenerationModuleRegistration: ModuleRegistration<undefined, RecommendationGenerationOutput> = {
  moduleId: "recommendation-generation-module",
  version: "1.0.0",
  domain: "clinical.nsclc",
  declaredInputs: ["knowledge:RankedRegimen", "knowledge:GuidelineMatch"],
  declaredOutputs: "output:Recommendation",
  confidenceProfile: ["evidenceStrength", "applicability", "sourceAgreement"],
  deterministic: true,
  requiresInjectedRandomness: false,
  run: (_inputs, ctx) => runRecommendationGenerationModule(ctx)
};

export { CONFIDENCE_POLICY_VERSION };
