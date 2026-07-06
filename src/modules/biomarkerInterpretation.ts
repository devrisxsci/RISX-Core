import type { ModuleRegistration, ModuleRunContext } from "../types.js";
import type { BiomarkerDefinitionClaim } from "../evidence/fixtures.js";

/**
 * Biomarker Interpretation Module — NSCLC Knowledge Slice v1.1, Section 6.2.
 * Inputs: Biomarker Results, Diagnosis (Canonical Objects).
 * Outputs: `Biomarker`, `Molecular Alteration` (Clinical Knowledge Objects).
 * Required Evidence Package: Biomarker Definitions.
 * Deterministic processing order: 1 (parallel-eligible with Staging Module).
 */

export interface InterpretedBiomarker {
  readonly biomarkerCode: string;
  readonly molecularAlteration: string;
  readonly classified: true;
}

export interface UnclassifiedBiomarkerResult {
  readonly rawResultCode: string;
  readonly classified: false;
}

export interface BiomarkerInterpretationOutput {
  readonly biomarkers: ReadonlyArray<InterpretedBiomarker>;
  readonly unclassified: ReadonlyArray<UnclassifiedBiomarkerResult>;
  readonly biomarkerDefinitionsVersion: string;
  readonly biomarkerDefinitionsContentHash: string;
}

export function runBiomarkerInterpretationModule(ctx: ModuleRunContext): BiomarkerInterpretationOutput {
  const manifest = ctx.evidence.packageManifest("biomarker-definitions");
  const definitions = ctx.evidence.queryAssertions<BiomarkerDefinitionClaim>("biomarker-definitions");

  const results = [...ctx.canonicalInputs.values()].filter((o) => o.canonicalObjectType === "BiomarkerResults");

  const biomarkers: InterpretedBiomarker[] = [];
  const unclassified: UnclassifiedBiomarkerResult[] = [];

  for (const result of results) {
    const payload = result.payload as { rawResultCode: string };
    const match = definitions.find((d) => d.claim.biomarkerCode === payload.rawResultCode);
    if (match) {
      biomarkers.push({
        biomarkerCode: match.claim.biomarkerCode,
        molecularAlteration: match.claim.molecularAlteration,
        classified: true
      });
    } else {
      // NSCLC spec, Canonical Object Inventory ("Biomarker Results"): unmapped
      // raw results must be "explicitly surfaced as unclassified ... never
      // silently dropped."
      unclassified.push({ rawResultCode: payload.rawResultCode, classified: false });
    }
  }

  return {
    biomarkers,
    unclassified,
    biomarkerDefinitionsVersion: manifest.version,
    biomarkerDefinitionsContentHash: manifest.contentHash
  };
}

export const biomarkerInterpretationModuleRegistration: ModuleRegistration<undefined, BiomarkerInterpretationOutput> =
  {
    moduleId: "biomarker-interpretation-module",
    version: "1.0.0",
    domain: "clinical.nsclc",
    declaredInputs: ["canonical:BiomarkerResults", "canonical:Diagnosis"],
    declaredOutputs: "knowledge:Biomarker",
    confidenceProfile: ["evidenceStrength", "applicability"],
    deterministic: true,
    requiresInjectedRandomness: false,
    run: (_inputs, ctx) => runBiomarkerInterpretationModule(ctx)
  };
