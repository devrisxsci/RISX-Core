import type { ModuleRegistration, ModuleRunContext } from "../types.js";
  import type { FdaLabelContraindicationClaim } from "@risx/common";
  import type { GuidelineMatchingOutput } from "./guidelineMatching.js";
  import type { ContentHash } from "@risx/common";

  /**
   * Regimen Selection Module — NSCLC Knowledge Slice v1.1, Section 6.4.
   * Inputs: Guideline Matching output; Treatment History, Medication List,
   * Laboratory Results (Canonical Inputs); Contraindication, Performance
   * Status (Clinical Knowledge Objects).
   * Output: ranked candidate Regimen(s), each tagged with Line of Therapy
   * and any applied Contraindication exclusions.
   * Required Evidence Package: FDA Drug Labels.
   * Deterministic processing order: 3.
   *
   * AR1 Stage 4: FdaLabelContraindicationClaim import moved from local
   * fixtures.ts to shared @risx/common (ADR-0006). No module logic changed.
   */

  export interface ContraindicationEvaluation {
    readonly assertionId: string;
    readonly therapy:     string;
    readonly matched:     boolean;
    readonly reason:      string | null;
  }

  export interface RankedRegimen {
    readonly regimenId:                 string;
    readonly decisionPointId:           string;
    readonly therapies:                 ReadonlyArray<string>;
    readonly evidenceStrength:          string;
    readonly lineOfTherapy:             number;
    readonly excludedByContraindication: boolean;
    readonly contraindicationReasons:   ReadonlyArray<string>;
  }

  export interface RegimenSelectionOutput {
    readonly rankedRegimens:              ReadonlyArray<RankedRegimen>;
    readonly contraindicationEvaluations: ReadonlyArray<ContraindicationEvaluation>;
    readonly fdaLabelsPackageVersion:     string;
    readonly fdaLabelsPackageContentHash: ContentHash;
  }

  function nextLineOfTherapyOrdinal(ctx: ModuleRunContext): number {
    const entries  = [...ctx.canonicalInputs.values()].filter(
      (o) => o.canonicalObjectType === "TreatmentHistoryEntry"
    );
    const ordinals = entries.map(
      (e) => (e.payload as { lineOfTherapyOrdinal: number }).lineOfTherapyOrdinal
    );
    const maxOrdinal = ordinals.length > 0 ? Math.max(...ordinals) : 0;
    return maxOrdinal + 1;
  }

  export function runRegimenSelectionModule(ctx: ModuleRunContext): RegimenSelectionOutput {
    const guidelineMatching = ctx.upstream.get("knowledge:GuidelineMatch") as GuidelineMatchingOutput | undefined;
    if (!guidelineMatching) {
      throw new Error("Regimen Selection Module: upstream Guideline Matching Module output was not available.");
    }

    const manifest             = ctx.evidence.packageManifest("fda-drug-labels-nsclc");
    const contraindicationRules = ctx.evidence.queryAssertions<FdaLabelContraindicationClaim>("fda-drug-labels-nsclc");

    const activeMedicationCodes = new Set(
      [...ctx.canonicalInputs.values()]
        .filter((o) => o.canonicalObjectType === "MedicationListEntry")
        .map((o) => o.payload as { medicationCode: string; status: string })
        .filter((m) => m.status === "active")
        .map((m) => m.medicationCode)
    );

    const labResults = [...ctx.canonicalInputs.values()]
      .filter((o) => o.canonicalObjectType === "LaboratoryResult")
      .map((o) => o.payload as { labTestCode: string; resultValue: number });

    const lineOfTherapyOrdinal = nextLineOfTherapyOrdinal(ctx);

    const contraindicationEvaluations: ContraindicationEvaluation[] = [];
    const rankedRegimens: RankedRegimen[] = [];

    for (const match of guidelineMatching.matches) {
      const reasonsForThisRegimen: string[] = [];

      for (const therapy of match.therapies) {
        const rulesForTherapy = contraindicationRules.filter((r) => r.claim.therapy === therapy);
        for (const rule of rulesForTherapy) {
          let ruleMatched = false;
          if (rule.claim.contraindicationRule === "medication-interaction") {
            ruleMatched = activeMedicationCodes.has(rule.claim.triggerCode);
          } else if (rule.claim.contraindicationRule === "lab-gate") {
            ruleMatched = labResults.some(
              (lab) => lab.labTestCode === rule.claim.triggerCode && lab.resultValue < 0.5
            );
          }
          contraindicationEvaluations.push({
            assertionId: rule.assertionId,
            therapy,
            matched:     ruleMatched,
            reason:      ruleMatched ? rule.claim.reason : null,
          });
          if (ruleMatched) {
            reasonsForThisRegimen.push(rule.claim.reason);
          }
        }
      }

      rankedRegimens.push({
        regimenId:                  match.recommendedRegimenId,
        decisionPointId:            match.decisionPointId,
        therapies:                  match.therapies,
        evidenceStrength:           match.evidenceStrength,
        lineOfTherapy:              lineOfTherapyOrdinal,
        excludedByContraindication: reasonsForThisRegimen.length > 0,
        contraindicationReasons:    reasonsForThisRegimen,
      });
    }

    return {
      rankedRegimens,
      contraindicationEvaluations,
      fdaLabelsPackageVersion:     manifest.version,
      fdaLabelsPackageContentHash: manifest.manifestHash,
    };
  }

  export const regimenSelectionModuleRegistration: ModuleRegistration<undefined, RegimenSelectionOutput> = {
    moduleId:                "regimen-selection-module",
    version:                 "1.0.0",
    domain:                  "clinical.nsclc",
    declaredInputs: [
      "knowledge:GuidelineMatch",
      "canonical:TreatmentHistoryEntry",
      "canonical:MedicationListEntry",
      "canonical:LaboratoryResult",
    ],
    declaredOutputs:          "knowledge:RankedRegimen",
    confidenceProfile:        ["evidenceStrength", "applicability"],
    deterministic:            true,
    requiresInjectedRandomness: false,
    run: (_inputs, ctx) => runRegimenSelectionModule(ctx),
  };
  