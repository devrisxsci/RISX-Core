import type { ModuleRegistration, ModuleRunContext } from "../types.js";
  import type { StageOutput } from "./staging.js";
  import type { BiomarkerInterpretationOutput } from "./biomarkerInterpretation.js";
  import type { ContentHash } from "@risx/common";

  /**
   * Guideline Matching Module — NSCLC Knowledge Slice v1.1, Section 6.3.
   * Inputs: `Stage`, `Biomarker`, `Molecular Alteration`, `Performance Status`
   * (Clinical Knowledge Objects); `Histology` (Canonical Input).
   * Output: matched guideline decision points, each carrying an
   * `Evidence Strength` value.
   * Required Evidence Package: NCCN NSCLC Guidelines.
   * Deterministic processing order: 2 (requires Staging + Biomarker
   * Interpretation to have completed).
   *
   * AR1 Step 2: `NccnDecisionPointClaim` has been retired from RISX-Core
   * (it was a fixture-era type; the claim type is now owned by the compiler).
   * This module reads compiled guideline assertions via the module-local
   * `GuidelineDecisionPointClaim` interface — Core's own structural reading
   * contract, not a re-declaration of NCCN domain knowledge. The shape matches
   * what the L4 compiler produces, but the contract is expressed in terms of
   * what this module reads (stageValue, biomarkerCode, etc.), not in terms of
   * NCCN-specific business rules. If the compiler ever changes assertion shape,
   * the module's reading contract must be updated in step.
   */

  /**
   * Structural reading contract for guideline decision-point assertions.
   * This is the Guideline Matching Module's own interface: it describes the
   * fields the module reads from a compiled evidence package assertion. It is
   * NOT a domain claim type and does not declare NCCN business rules.
   */
  interface GuidelineDecisionPointClaim {
    readonly stageValue: string;
    readonly biomarkerCode: string | null;
    readonly recommendedRegimenId: string;
    readonly therapies: ReadonlyArray<string>;
    readonly evidenceStrength: string;
  }

  export interface MatchedDecisionPoint {
    readonly decisionPointId: string;
    readonly stageValue: string;
    readonly biomarkerCode: string | null;
    readonly recommendedRegimenId: string;
    readonly therapies: ReadonlyArray<string>;
    readonly evidenceStrength: string;
  }

  export interface GuidelineMatchingOutput {
    readonly matches: ReadonlyArray<MatchedDecisionPoint>;
    readonly nccnPackageVersion: string;
    readonly nccnPackageContentHash: ContentHash;
  }

  export function runGuidelineMatchingModule(ctx: ModuleRunContext): GuidelineMatchingOutput {
    const stage = ctx.upstream.get("knowledge:Stage") as StageOutput | undefined;
    const biomarkerOutput = ctx.upstream.get("knowledge:Biomarker") as BiomarkerInterpretationOutput | undefined;
    if (!stage) {
      throw new Error("Guideline Matching Module: upstream Staging Module output was not available.");
    }
    if (!biomarkerOutput) {
      throw new Error("Guideline Matching Module: upstream Biomarker Interpretation Module output was not available.");
    }

    const manifest = ctx.evidence.packageManifest("nccn-nsclc-guidelines");
    const decisionPoints = ctx.evidence.queryAssertions<GuidelineDecisionPointClaim>("nccn-nsclc-guidelines");

    const biomarkerCodes = biomarkerOutput.biomarkers.map((b) => b.biomarkerCode);
    const matches: MatchedDecisionPoint[] = [];

    for (const dp of decisionPoints) {
      if (dp.claim.stageValue !== stage.stageValue) continue;
      if (dp.claim.biomarkerCode !== null && !biomarkerCodes.includes(dp.claim.biomarkerCode)) continue;
      matches.push({
        decisionPointId: dp.assertionId,
        stageValue: dp.claim.stageValue,
        biomarkerCode: dp.claim.biomarkerCode,
        recommendedRegimenId: dp.claim.recommendedRegimenId,
        therapies: dp.claim.therapies,
        evidenceStrength: dp.claim.evidenceStrength
      });
    }

    // Deterministic ordering: prefer biomarker-specific matches over the
    // biomarker-agnostic default, then order by decisionPointId for stability.
    matches.sort((a, b) => {
      const aSpecific = a.biomarkerCode !== null ? 0 : 1;
      const bSpecific = b.biomarkerCode !== null ? 0 : 1;
      if (aSpecific !== bSpecific) return aSpecific - bSpecific;
      return a.decisionPointId.localeCompare(b.decisionPointId);
    });

    return {
      matches,
      nccnPackageVersion: manifest.version,
      nccnPackageContentHash: manifest.manifestHash
    };
  }

  export const guidelineMatchingModuleRegistration: ModuleRegistration<undefined, GuidelineMatchingOutput> = {
    moduleId: "guideline-matching-module",
    version: "1.0.0",
    domain: "clinical.nsclc",
    declaredInputs: ["knowledge:Stage", "knowledge:Biomarker", "canonical:Histology"],
    declaredOutputs: "knowledge:GuidelineMatch",
    confidenceProfile: ["evidenceStrength", "sourceAgreement"],
    deterministic: true,
    requiresInjectedRandomness: false,
    run: (_inputs, ctx) => runGuidelineMatchingModule(ctx)
  };
  