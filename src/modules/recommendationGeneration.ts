import type { ModuleRegistration, ModuleRunContext, RegimenCandidate, NsclcRecommendationConclusion, TypedConfidence } from "../types.js";
import type { RegimenSelectionOutput } from "./regimenSelection.js";
import type { GuidelineMatchingOutput } from "./guidelineMatching.js";

/**
 * Recommendation Generation Module — NSCLC Knowledge Slice v1.1, Section 6.5.
 * Terminal module: consumes Regimen Selection + Guideline Matching outputs
 * only; reads no Evidence Package itself (Section 6.5, "does not re-read
 * Evidence Packages itself").
 * Deterministic processing order: 4 (terminal).
 *
 * STAGE C: `TypedConfidence` is now the concrete RISX-Common v2.0 shape
 * (ADR-0002 Part A): `evidenceStrength` is a string categorical label (e.g.
 * "NCCN-Category-1"), not a number. `statisticalUncertainty` is omitted
 * (undefined) — not applicable at per-candidate level in Phase P2.
 * `aggregationPolicyVersion` is removed; it was not part of the ADR-0002
 * Part A shape. The AGGREGATION RULE (ADR-0002 Part B) remains open; this
 * module still carries a provisional "take upstream strength score for
 * ranking" logic, but the confidence field reflects only the direct guideline
 * category label, not an invented aggregate number.
 *
 * `RecommendationGenerationOutput.recommendation` is now typed as
 * `NsclcRecommendationConclusion` (the Core-local domain payload renamed from
 * the provisional local `RecommendationObject`). The Analytics Runtime wraps
 * it in the RISX-Common `RecommendationObject` envelope after audit sealing.
 */

function evidenceCategoryToStrengthScore(evidenceStrength: string): number {
  // NCCN Category 1 is the strongest guideline rating in this fixture set;
  // this mapping is local to Phase P2's fixtures, not a platform-wide scale.
  if (evidenceStrength === "NCCN-Category-1") return 1.0;
  return 0.5;
}

function buildCandidateConfidence(evidenceStrength: string, applicability: number, sourceAgreement: number): TypedConfidence {
  // ADR-0002 Part A: evidenceStrength is the categorical string label from
  // the guideline assertion, not a derived numeric score. The numeric score
  // (`evidenceCategoryToStrengthScore`) is used ONLY for ranking candidate
  // regimens, never for the TypedConfidence field itself.
  // statisticalUncertainty is omitted (undefined) — not applicable here.
  return { evidenceStrength, applicability, sourceAgreement };
}

export interface RecommendationGenerationOutput {
  readonly recommendation: NsclcRecommendationConclusion;
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
    confidence: buildCandidateConfidence(r.evidenceStrength, 1.0, 1.0)
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
      confidence: buildCandidateConfidence(r.evidenceStrength, 0, 1.0)
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
