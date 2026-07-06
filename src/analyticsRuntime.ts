import { z } from "zod";
import { admitCanonicalInputs, type CanonicalObjectType } from "./canonicalInputGateway.js";
import { EvidenceQueryLayer } from "./evidenceQueryLayer.js";
import { ModuleRegistry } from "./moduleRegistry.js";
import { ModuleOrchestrator } from "./moduleOrchestrator.js";
import { ALL_FIXTURE_PACKAGES } from "./evidence/fixtures.js";
import { stagingModuleRegistration, type StageOutput } from "./modules/staging.js";
import {
  biomarkerInterpretationModuleRegistration,
  type BiomarkerInterpretationOutput
} from "./modules/biomarkerInterpretation.js";
import { guidelineMatchingModuleRegistration, type GuidelineMatchingOutput } from "./modules/guidelineMatching.js";
import { regimenSelectionModuleRegistration, type RegimenSelectionOutput } from "./modules/regimenSelection.js";
import {
  recommendationGenerationModuleRegistration,
  type RecommendationGenerationOutput
} from "./modules/recommendationGeneration.js";
import { buildClinicalResult, sealAuditObject } from "./auditReplay.js";
import { sha256Hex } from "./hash.js";
import type { AuditObject, ClinicalResult, ExecutionContext, TypedConfidence } from "./types.js";

/**
 * Analytics Runtime (Computational Core architecture, Section 7: "the
 * component that carries a canonical input through the eight-phase pipeline
 * to a sealed result"). This is the single entry point of RISX-Core for
 * Phase P2: ADMIT -> PIN -> CONTEXT -> PLAN -> EXECUTE -> RESOLVE ->
 * ASSEMBLE -> SEAL.
 *
 * Phase P2 scope note: RESOLVE (the Cross-Domain Reasoner's conflict
 * resolution phase) is a documented no-op here, because Phase P2 registers
 * exactly one domain (`clinical.nsclc`) and cross-domain conflicts cannot
 * arise with a single domain (Master Program Plan Phase P2, "single-domain
 * execution only, no cross-domain reasoning"). The phase still executes,
 * explicitly, rather than being silently skipped, so the eight-phase
 * pipeline in the governing architecture is not violated by omission.
 */

const CanonicalInputCandidateSchema = z.object({
  canonicalObjectType: z.string(),
  id: z.string(),
  payload: z.unknown()
});

export interface AnalyticsRuntimeInputs {
  readonly canonicalInputs: ReadonlyArray<{ canonicalObjectType: CanonicalObjectType; id: string; payload: unknown }>;
  readonly executionContext: ExecutionContext;
}

export interface AnalyticsRuntimeResult {
  readonly clinicalResult: ClinicalResult;
  readonly audit: AuditObject;
}

const CLINICAL_MODULE_IDS = [
  "staging-module",
  "biomarker-interpretation-module",
  "guideline-matching-module",
  "regimen-selection-module",
  "recommendation-generation-module"
] as const;

export function buildClinicalRegistry(): ModuleRegistry {
  const registry = new ModuleRegistry();
  registry.register(stagingModuleRegistration);
  registry.register(biomarkerInterpretationModuleRegistration);
  registry.register(guidelineMatchingModuleRegistration);
  registry.register(regimenSelectionModuleRegistration);
  registry.register(recommendationGenerationModuleRegistration);
  return registry;
}

export class AnalyticsRuntime {
  private readonly registry: ModuleRegistry;
  private readonly orchestrator: ModuleOrchestrator;

  constructor(registry: ModuleRegistry = buildClinicalRegistry()) {
    this.registry = registry;
    this.orchestrator = new ModuleOrchestrator(registry);
  }

  execute(inputs: AnalyticsRuntimeInputs): AnalyticsRuntimeResult {
    // Validate the request shape itself before touching the gateway, so a
    // malformed request is rejected the same way any other invalid input is.
    for (const candidate of inputs.canonicalInputs) {
      CanonicalInputCandidateSchema.parse(candidate);
    }

    // Phase ADMIT
    const canonicalInputs = admitCanonicalInputs(inputs.canonicalInputs);
    const canonicalInputFingerprint = sha256Hex(
      [...canonicalInputs.entries()].sort(([a], [b]) => a.localeCompare(b))
    );

    // Phase PIN
    const evidence = EvidenceQueryLayer.pin(ALL_FIXTURE_PACKAGES);
    const evidenceSnapshot = evidence.snapshot();

    // Phase CONTEXT
    const executionContext = inputs.executionContext;

    // Phase PLAN
    const plan = this.orchestrator.plan(CLINICAL_MODULE_IDS);

    // Phase EXECUTE
    const outputs = this.orchestrator.execute(plan, { executionContext, evidence, canonicalInputs });

    // Phase RESOLVE (documented no-op — see file header)
    const resolvedConflicts: never[] = [];

    // Phase ASSEMBLE
    const recommendationGeneration = outputs.get("recommendation-generation-module") as
      | RecommendationGenerationOutput
      | undefined;
    if (!recommendationGeneration) {
      throw new Error("Analytics Runtime: Recommendation Generation Module did not produce an output.");
    }

    const staging = outputs.get("staging-module") as StageOutput;
    const biomarker = outputs.get("biomarker-interpretation-module") as BiomarkerInterpretationOutput;
    const guidelineMatching = outputs.get("guideline-matching-module") as GuidelineMatchingOutput;
    const regimenSelection = outputs.get("regimen-selection-module") as RegimenSelectionOutput;

    const warnings: string[] = [...staging.warnings];
    if (biomarker.unclassified.length > 0) {
      warnings.push(
        `${biomarker.unclassified.length} biomarker result(s) could not be classified against the pinned Biomarker Definitions package and were surfaced, not dropped.`
      );
    }

    const eligibleCandidates = recommendationGeneration.recommendation.rankedRegimens.filter(
      (r) => !r.excludedByContraindication
    );
    const aggregateConfidence: TypedConfidence =
      eligibleCandidates[0]?.confidence ?? {
        evidenceStrength: 0,
        applicability: 0,
        sourceAgreement: 0,
        statisticalUncertainty: null,
        aggregationPolicyVersion: "provisional-no-eligible-candidate"
      };

    const moduleSet = CLINICAL_MODULE_IDS.map((id) => {
      const reg = this.registry.get(id);
      return { moduleId: reg.moduleId, version: reg.version };
    });

    // Phase SEAL
    const audit = sealAuditObject({
      moduleSet,
      evidenceSnapshot,
      canonicalInputFingerprint,
      executionDag: plan.map((p) => ({ moduleId: p.moduleId, dependsOn: p.dependsOn })),
      executionContext,
      recommendation: recommendationGeneration.recommendation,
      aggregateConfidence
    });
    void resolvedConflicts;

    const evidenceRefs = [
      staging.ajccPackageContentHash,
      biomarker.biomarkerDefinitionsContentHash,
      guidelineMatching.nccnPackageContentHash,
      regimenSelection.fdaLabelsPackageContentHash
    ];

    const clinicalResult = buildClinicalResult({
      id: sha256Hex({ audit: audit.auditId, kind: "ClinicalResult" }),
      audit,
      recommendation: recommendationGeneration.recommendation,
      aggregateConfidence,
      warnings,
      canonicalObjectIds: [...canonicalInputs.keys()],
      evidenceRefs
    });

    return { clinicalResult, audit };
  }
}
