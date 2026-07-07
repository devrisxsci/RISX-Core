import type { EvidencePackage } from "../types.js";
  import { computeContentHash, EvidencePackageManifestSchema, type ContentHash } from "@risx/common";
  import { COMPILED_NCCN_PACKAGE_DATA } from "./compiled/nccn-nsclc-package.js";

  /**
   * Fixture Evidence Packages for the NSCLC Enterprise Knowledge Slice.
   *
   * AR1 Step 2 (2026-07-07): The NCCN NSCLC Guidelines package is no longer a
   * hand-authored fixture. It is now loaded from the committed artifact produced
   * by RISX-Knowledge-Compiler v1.0.0 (compilerId "risx-knowledge-compiler").
   * See CHANGELOG.md for the provenance record and audit-hash change note.
   *
   * The three remaining packages (AJCC staging, biomarker definitions, FDA
   * labels) remain hand-authored fixtures until their own compiler packages exist.
   *
   * STAGE C: each fixture's manifest is now @risx/common's v2.0
   * `EvidencePackageManifest` (one of the three consumed surfaces), which
   * requires a full hash TREE (EPS §15/Fig 15.1/EP-10) rather than the prior
   * stage's single flat `contentHash`.
   */

  const FIXTURE_COMPILER_ID = "risx-core-phase-p2-fixture-compiler";
  const FIXTURE_COMPILER_VERSION = "0.1.0";
  const FIXTURE_CREATED_AT = "2026-01-01T00:00:00.000Z";
  const FIXTURE_COMPATIBLE_WITH = ["1.0.0"];

  function buildPackage<TClaim>(
    packageId: string,
    version: string,
    source: string,
    assertions: EvidencePackage<TClaim>["assertions"]
  ): EvidencePackage<TClaim> {
    const headerHash: ContentHash = computeContentHash({ packageId, version, source });
    const metadataHash: ContentHash = computeContentHash({
      compilerId: FIXTURE_COMPILER_ID,
      compilerVersion: FIXTURE_COMPILER_VERSION,
      createdAt: FIXTURE_CREATED_AT,
      compatibleWith: FIXTURE_COMPATIBLE_WITH
    });
    const bodyHashes: ContentHash[] = [computeContentHash(assertions)];
    const supportingResourceHashes: ContentHash[] = [];
    const manifestHash: ContentHash = computeContentHash({
      packageId,
      version,
      compilerId: FIXTURE_COMPILER_ID,
      compilerVersion: FIXTURE_COMPILER_VERSION,
      headerHash,
      metadataHash,
      bodyHashes,
      supportingResourceHashes,
      compatibleWith: FIXTURE_COMPATIBLE_WITH,
      createdAt: FIXTURE_CREATED_AT
    });
    const signature = {
      signedBy: FIXTURE_COMPILER_ID,
      value: computeContentHash({ manifestHash, signedBy: FIXTURE_COMPILER_ID }).digest
    };

    const manifest = EvidencePackageManifestSchema.parse({
      objectType: "EvidencePackageManifest",
      packageKind: "evidence",
      packageId,
      version,
      compilerId: FIXTURE_COMPILER_ID,
      compilerVersion: FIXTURE_COMPILER_VERSION,
      headerHash,
      metadataHash,
      bodyHashes,
      supportingResourceHashes,
      manifestHash,
      signature,
      compatibleWith: FIXTURE_COMPATIBLE_WITH,
      createdAt: FIXTURE_CREATED_AT,
      evidenceObjectIds: assertions.map((a) => a.assertionId),
      provenancePointers: []
    });

    return { manifest, source, assertions };
  }

  export interface AjccStageClaim {
    readonly stageValue: string;
    readonly tCategory: string;
    readonly nCategory: string;
    readonly mCategory: string;
  }

  export const AJCC_STAGING_MANUAL = buildPackage<AjccStageClaim>(
    "ajcc-staging-manual",
    "8.0.0+AJCC-8th-Edition",
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
    "2026.1.0",
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

  export interface FdaLabelContraindicationClaim {
    readonly therapy: string;
    readonly contraindicationRule: "medication-interaction" | "lab-gate";
    readonly triggerCode: string;
    readonly reason: string;
  }

  export const FDA_DRUG_LABELS = buildPackage<FdaLabelContraindicationClaim>(
    "fda-drug-labels-nsclc",
    "2026.5.0+FDA-Labels-2026-05",
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

  /**
   * AR1 Step 2: NCCN NSCLC Guidelines — loaded from the committed compiler
   * artifact. No longer a hand-authored fixture. The manifest carries the
   * genuine compilerId "risx-knowledge-compiler" and its corresponding hashes.
   *
   * EvidencePackage<unknown>: the claim type is structurally read by the
   * Guideline Matching Module via its own module-local reading contract
   * (see modules/guidelineMatching.ts), not by Core-declared NCCN domain types.
   */
  function loadCompiledPackage(raw: typeof COMPILED_NCCN_PACKAGE_DATA): EvidencePackage<unknown> {
    return {
      manifest: EvidencePackageManifestSchema.parse(raw.manifest),
      source: raw.source,
      assertions: raw.assertions as EvidencePackage<unknown>["assertions"],
    };
  }

  export const NCCN_NSCLC_GUIDELINES: EvidencePackage<unknown> =
    loadCompiledPackage(COMPILED_NCCN_PACKAGE_DATA);

  export const ALL_FIXTURE_PACKAGES = [
    AJCC_STAGING_MANUAL,
    BIOMARKER_DEFINITIONS,
    NCCN_NSCLC_GUIDELINES,
    FDA_DRUG_LABELS
  ] as const;
  