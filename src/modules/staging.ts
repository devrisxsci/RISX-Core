import type { ModuleRegistration, ModuleRunContext } from "../types.js";
  import type { AjccStagingClaim } from "@risx/common";
  import type { ContentHash } from "@risx/common";

  /**
   * Staging Module — NSCLC Knowledge Slice v1.1, Section 6.1.
   * Inputs: Disease Stage, Imaging Summary, Diagnosis (Canonical Objects).
   * Output: `Stage` (Clinical Knowledge Object).
   * Required Evidence Package: AJCC Staging Manual.
   * Deterministic processing order: 1 (parallel-eligible with Biomarker
   * Interpretation Module — no data dependency between them).
   */

  export interface StageOutput {
    readonly stageValue:                  string;
    readonly ajccPackageVersion:          string;
    readonly ajccPackageContentHash:      ContentHash;
    readonly consultedCanonicalObjectIds: ReadonlyArray<string>;
    readonly warnings:                    ReadonlyArray<string>;
  }

  export class StagingValidationError extends Error {}

  function findDiseaseStageInput(ctx: ModuleRunContext) {
    for (const [id, obj] of ctx.canonicalInputs) {
      if (obj.canonicalObjectType === "DiseaseStage") return { id, obj };
    }
    return undefined;
  }

  function findImagingSummary(ctx: ModuleRunContext) {
    for (const [id, obj] of ctx.canonicalInputs) {
      if (obj.canonicalObjectType === "ImagingSummary") return { id, obj };
    }
    return undefined;
  }

  export function runStagingModule(ctx: ModuleRunContext): StageOutput {
    const diseaseStage = findDiseaseStageInput(ctx);
    if (!diseaseStage) {
      throw new StagingValidationError("Staging Module: no DiseaseStage canonical input was admitted for this run.");
    }
    const imaging  = findImagingSummary(ctx);
    const manifest = ctx.evidence.packageManifest("ajcc-staging-manual");
    const assertions = ctx.evidence.queryAssertions<AjccStagingClaim>("ajcc-staging-manual");

    const payload = diseaseStage.obj.payload as {
      tCategory: string;
      nCategory: string;
      mCategory: string;
    };

    const matched = assertions.find(
      (a) =>
        a.claim.tCategory === payload.tCategory &&
        a.claim.nCategory === payload.nCategory &&
        a.claim.mCategory === payload.mCategory
    );

    if (!matched) {
      // NSCLC spec, Canonical Object Inventory ("Disease Stage"): "classification
      // not covered by the pinned AJCC edition is a validation failure, not a
      // best-guess default."
      throw new StagingValidationError(
        `Staging Module: T/N/M combination (${payload.tCategory}/${payload.nCategory}/${payload.mCategory}) is not covered by pinned AJCC Staging Manual ${manifest.version}. No best-guess default is permitted.`
      );
    }

    const consultedIds = [diseaseStage.id];
    const warnings: string[] = [];
    if (imaging) {
      consultedIds.push(imaging.id);
    } else {
      warnings.push("No Imaging Summary was supplied for this run; staging was derived from Disease Stage input alone.");
    }

    return {
      stageValue:                  matched.claim.stageValue,
      ajccPackageVersion:          manifest.version,
      ajccPackageContentHash:      manifest.manifestHash,
      consultedCanonicalObjectIds: consultedIds,
      warnings,
    };
  }

  export const stagingModuleRegistration: ModuleRegistration<undefined, StageOutput> = {
    moduleId:                 "staging-module",
    version:                  "1.0.0",
    domain:                   "clinical.nsclc",
    declaredInputs:           ["canonical:DiseaseStage", "canonical:ImagingSummary", "canonical:Diagnosis"],
    declaredOutputs:          "knowledge:Stage",
    confidenceProfile:        ["evidenceStrength", "applicability"],
    deterministic:            true,
    requiresInjectedRandomness: false,
    run: (_inputs, ctx) => runStagingModule(ctx),
  };
  