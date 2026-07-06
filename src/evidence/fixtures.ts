import type { EvidencePackage } from "../types.js";
import { sha256Hex } from "../hash.js";

/**
 * Fixture Evidence Packages for the NSCLC Enterprise Knowledge Slice.
 *
 * These are minimal, self-contained stand-ins for packages that would, in the
 * full platform, be compiled and published by RISX-Knowledge-Compiler (L4)
 * and stored by RISX-Evidence (L5) — neither of which exists yet. Per IA-003
 * scope ("No Integration", "Reasoning only"), RISX-Core does not implement a
 * compiler or a repository; it only implements the Evidence Query Layer's
 * consumption contract against pinned package content. Each fixture package
 * carries a real, verifiable SHA-256 content hash computed over its
 * canonicalized body, so pinning-by-version-and-hash (GR-15/GR-16) and
 * hash-verification-on-replay (EP-45) are genuinely exercised, not
 * simulated. There is no digital signature chain, because there is no
 * Knowledge Compiler to be the trusted signer (EP-13) — this is a documented
 * Phase P2 simplification, not a claim of full Evidence Package conformance.
 */

function buildPackage<TClaim>(
  packageId: string,
  version: string,
  source: string,
  assertions: EvidencePackage<TClaim>["assertions"]
): EvidencePackage<TClaim> {
  const contentHash = sha256Hex({ packageId, version, source, assertions });
  return {
    manifest: { packageId, version, source, contentHash },
    assertions
  };
}

export interface AjccStageClaim {
  readonly stageValue: string;
  readonly tCategory: string;
  readonly nCategory: string;
  readonly mCategory: string;
}

export const AJCC_STAGING_MANUAL = buildPackage<AjccStageClaim>(
  "ajcc-staging-manual",
  "AJCC-8th-Edition",
  "AJCC/UICC",
  [
    {
      assertionId: "ajcc-iiia",
      evidenceCategory: "AJCC-8-Definitive",
      claim: { stageValue: "IIIA", tCategory: "T2", nCategory: "N2", mCategory: "M0" },
      citation: "AJCC Cancer Staging Manual, 8th Edition, Lung Cancer chapter"
    },
    {
      assertionId: "ajcc-iv",
      evidenceCategory: "AJCC-8-Definitive",
      claim: { stageValue: "IV", tCategory: "T4", nCategory: "N3", mCategory: "M1" },
      citation: "AJCC Cancer Staging Manual, 8th Edition, Lung Cancer chapter"
    }
  ]
);

export interface BiomarkerDefinitionClaim {
  readonly biomarkerCode: string;
  readonly displayName: string;
  readonly molecularAlteration: string;
  readonly positivityThreshold: string;
}

export const BIOMARKER_DEFINITIONS = buildPackage<BiomarkerDefinitionClaim>(
  "biomarker-definitions",
  "2026.1",
  "Biomarker Definitions Curators",
  [
    {
      assertionId: "biomarker-egfr-ex19del",
      evidenceCategory: "Curated-Actionable",
      claim: {
        biomarkerCode: "EGFR-EX19DEL",
        displayName: "EGFR exon 19 deletion",
        molecularAlteration: "EGFR exon 19 deletion",
        positivityThreshold: "detected"
      },
      citation: "Biomarker Definitions v2026.1, EGFR panel"
    },
    {
      assertionId: "biomarker-alk-fusion",
      evidenceCategory: "Curated-Actionable",
      claim: {
        biomarkerCode: "ALK-FUSION",
        displayName: "ALK fusion",
        molecularAlteration: "ALK gene rearrangement",
        positivityThreshold: "detected"
      },
      citation: "Biomarker Definitions v2026.1, ALK panel"
    }
  ]
);

export interface NccnDecisionPointClaim {
  readonly stageValue: string;
  readonly biomarkerCode: string | null;
  readonly recommendedRegimenId: string;
  readonly therapies: ReadonlyArray<string>;
  readonly evidenceStrength: string;
}

export const NCCN_NSCLC_GUIDELINES = buildPackage<NccnDecisionPointClaim>(
  "nccn-nsclc-guidelines",
  "NCCN-NSCLC-v2026.3",
  "National Comprehensive Cancer Network",
  [
    {
      assertionId: "nccn-dp-egfr-ex19del-iv",
      evidenceCategory: "NCCN-Category-1",
      claim: {
        stageValue: "IV",
        biomarkerCode: "EGFR-EX19DEL",
        recommendedRegimenId: "osimertinib-monotherapy",
        therapies: ["osimertinib"],
        evidenceStrength: "NCCN-Category-1"
      },
      citation: "NCCN Guidelines NSCLC v2026.3, Systemic Therapy — EGFR-mutated"
    },
    {
      assertionId: "nccn-dp-alk-fusion-iv",
      evidenceCategory: "NCCN-Category-1",
      claim: {
        stageValue: "IV",
        biomarkerCode: "ALK-FUSION",
        recommendedRegimenId: "alectinib-monotherapy",
        therapies: ["alectinib"],
        evidenceStrength: "NCCN-Category-1"
      },
      citation: "NCCN Guidelines NSCLC v2026.3, Systemic Therapy — ALK-positive"
    },
    {
      assertionId: "nccn-dp-no-biomarker-iv",
      evidenceCategory: "NCCN-Category-1",
      claim: {
        stageValue: "IV",
        biomarkerCode: null,
        recommendedRegimenId: "carboplatin-pemetrexed-pembrolizumab",
        therapies: ["carboplatin", "pemetrexed", "pembrolizumab"],
        evidenceStrength: "NCCN-Category-1"
      },
      citation: "NCCN Guidelines NSCLC v2026.3, Systemic Therapy — no actionable driver"
    }
  ]
);

export interface FdaLabelContraindicationClaim {
  readonly therapy: string;
  readonly contraindicationRule: "medication-interaction" | "lab-gate";
  readonly triggerCode: string;
  readonly reason: string;
}

export const FDA_DRUG_LABELS = buildPackage<FdaLabelContraindicationClaim>(
  "fda-drug-labels-nsclc",
  "FDA-Labels-2026-05",
  "U.S. Food and Drug Administration",
  [
    {
      assertionId: "fda-pemetrexed-renal",
      evidenceCategory: "FDA-Label-Contraindication",
      claim: {
        therapy: "pemetrexed",
        contraindicationRule: "lab-gate",
        triggerCode: "CREATININE-CLEARANCE-LOW",
        reason: "Pemetrexed is contraindicated with creatinine clearance below the labeled threshold."
      },
      citation: "FDA Prescribing Information, pemetrexed, Contraindications section"
    },
    {
      assertionId: "fda-osimertinib-qt",
      evidenceCategory: "FDA-Label-Contraindication",
      claim: {
        therapy: "osimertinib",
        contraindicationRule: "medication-interaction",
        triggerCode: "STRONG-CYP3A4-INDUCER",
        reason: "Osimertinib co-administration with strong CYP3A4 inducers is contraindicated per label."
      },
      citation: "FDA Prescribing Information, osimertinib, Drug Interactions section"
    }
  ]
);

export const ALL_FIXTURE_PACKAGES = [
  AJCC_STAGING_MANUAL,
  BIOMARKER_DEFINITIONS,
  NCCN_NSCLC_GUIDELINES,
  FDA_DRUG_LABELS
] as const;
