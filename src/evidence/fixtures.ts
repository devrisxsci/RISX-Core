import type { EvidencePackage } from "../types.js";
  import { computeContentHash, EvidencePackageManifestSchema, type ContentHash } from "@risx/common";
  import { COMPILED_NCCN_PACKAGE_DATA } from "./compiled/nccn-nsclc-package.js";
  import { COMPILED_FDA_PACKAGE_DATA } from "./compiled/fda-labels-package.js";

  /**
   * Fixture Evidence Packages for the NSCLC Enterprise Knowledge Slice.
   *
   * AR1 Step 2 (2026-07-07): The NCCN NSCLC Guidelines package is no longer a
   * hand-authored fixture. It is loaded from the committed artifact produced
   * by RISX-Knowledge-Compiler v1.0.0 (compilerId "risx-knowledge-compiler").
   *
   * AR1 Stage 4 (2026-07-07): The FDA Drug Labels package is no longer a
   * hand-authored fixture. It is loaded from the committed artifact produced
   * by RISX-Knowledge-Compiler v1.0.0 (compilerId "risx-knowledge-compiler").
   * NOTE (expected/correct): audit.id and evidenceSnapshot.contentHash for
   * FDA-dependent runs will differ from pre-Stage-4 runs — genuine compilerId
   * replaces the fixture placeholder. Clinical/exclusion behavior is unchanged.
   * This is a breaking audit-provenance change, not a reasoning change.
   *
   * The two remaining packages (AJCC staging, biomarker definitions) remain
   * hand-authored fixtures until their own compiler packages exist.
   *
   * STAGE C: each fixture's manifest is @risx/common's v2.0
   * EvidencePackageManifest, which requires a full hash TREE.
   */

  const FIXTURE_COMPILER_ID      = "risx-core-phase-p2-fixture-compiler";
  const FIXTURE_COMPILER_VERSION = "0.1.0";
  const FIXTURE_CREATED_AT       = "2026-01-01T00:00:00.000Z";
  const FIXTURE_COMPATIBLE_WITH  = ["1.0.0"];

  function buildPackage<TClaim>(
    packageId:  string,
    version:    string,
    source:     string,
    assertions: EvidencePackage<TClaim>["assertions"]
  ): EvidencePackage<TClaim> {
    const headerHash: ContentHash   = computeContentHash({ packageId, version, source });
    const metadataHash: ContentHash = computeContentHash({
      compilerId:      FIXTURE_COMPILER_ID,
      compilerVersion: FIXTURE_COMPILER_VERSION,
      createdAt:       FIXTURE_CREATED_AT,
      compatibleWith:  FIXTURE_COMPATIBLE_WITH,
    });
    const bodyHashes: ContentHash[]              = [computeContentHash(assertions)];
    const supportingResourceHashes: ContentHash[] = [];
    const manifestHash: ContentHash = computeContentHash({
      packageId,
      version,
      compilerId:      FIXTURE_COMPILER_ID,
      compilerVersion: FIXTURE_COMPILER_VERSION,
      headerHash,
      metadataHash,
      bodyHashes,
      supportingResourceHashes,
      compatibleWith:  FIXTURE_COMPATIBLE_WITH,
      createdAt:       FIXTURE_CREATED_AT,
    });
    const signature = {
      signedBy: FIXTURE_COMPILER_ID,
      value:    computeContentHash({ manifestHash, signedBy: FIXTURE_COMPILER_ID }).digest,
    };
    const manifest = EvidencePackageManifestSchema.parse({
      objectType:               "EvidencePackageManifest",
      packageKind:              "evidence",
      packageId,
      version,
      compilerId:               FIXTURE_COMPILER_ID,
      compilerVersion:          FIXTURE_COMPILER_VERSION,
      headerHash,
      metadataHash,
      bodyHashes,
      supportingResourceHashes,
      manifestHash,
      signature,
      compatibleWith:           FIXTURE_COMPATIBLE_WITH,
      createdAt:                FIXTURE_CREATED_AT,
      evidenceObjectIds:        assertions.map((a) => a.assertionId),
      provenancePointers:       [],
    });
    return { manifest, source, assertions };
  }

  export interface AjccStageClaim {
    readonly stageValue:  string;
    readonly tCategory:   string;
    readonly nCategory:   string;
    readonly mCategory:   string;
  }

  export const AJCC_STAGING_MANUAL = buildPackage<AjccStageClaim>(
    "ajcc-staging-manual",
    "8.0.0+AJCC-8th-Edition",
    "AJCC/UICC",
    [
      {
        assertionId:       "ajcc-iiia",
        evidenceCategory:  "AJCC-8-Definitive",
        claim:             { stageValue: "IIIA", tCategory: "T2", nCategory: "N2", mCategory: "M0" },
        citation:          "AJCC Cancer Staging Manual, 8th Edition, Lung Cancer chapter",
      },
      {
        assertionId:       "ajcc-iv",
        evidenceCategory:  "AJCC-8-Definitive",
        claim:             { stageValue: "IV", tCategory: "T4", nCategory: "N3", mCategory: "M1" },
        citation:          "AJCC Cancer Staging Manual, 8th Edition, Lung Cancer chapter",
      },
    ]
  );

  export interface BiomarkerDefinitionClaim {
    readonly biomarkerCode:          string;
    readonly displayName:            string;
    readonly molecularAlteration:    string;
    readonly positivityThreshold:    string;
  }

  export const BIOMARKER_DEFINITIONS = buildPackage<BiomarkerDefinitionClaim>(
    "biomarker-definitions",
    "2026.1.0",
    "Biomarker Definitions Curators",
    [
      {
        assertionId:       "biomarker-egfr-ex19del",
        evidenceCategory:  "Curated-Actionable",
        claim: {
          biomarkerCode:       "EGFR-EX19DEL",
          displayName:         "EGFR exon 19 deletion",
          molecularAlteration: "EGFR exon 19 deletion",
          positivityThreshold: "detected",
        },
        citation: "Biomarker Definitions v2026.1, EGFR panel",
      },
      {
        assertionId:       "biomarker-alk-fusion",
        evidenceCategory:  "Curated-Actionable",
        claim: {
          biomarkerCode:       "ALK-FUSION",
          displayName:         "ALK fusion",
          molecularAlteration: "ALK gene rearrangement",
          positivityThreshold: "detected",
        },
        citation: "Biomarker Definitions v2026.1, ALK panel",
      },
    ]
  );

  /**
   * AR1 Step 2: NCCN NSCLC Guidelines — loaded from the committed compiler
   * artifact. No longer a hand-authored fixture. The manifest carries the
   * genuine compilerId "risx-knowledge-compiler" and its corresponding hashes.
   */
  function loadCompiledPackage(raw: typeof COMPILED_NCCN_PACKAGE_DATA): EvidencePackage<unknown> {
    return {
      manifest:   EvidencePackageManifestSchema.parse(raw.manifest),
      source:     raw.source,
      assertions: raw.assertions as EvidencePackage<unknown>["assertions"],
    };
  }

  export const NCCN_NSCLC_GUIDELINES: EvidencePackage<unknown> =
    loadCompiledPackage(COMPILED_NCCN_PACKAGE_DATA);

  /**
   * AR1 Stage 4: FDA Drug Labels — loaded from the committed compiler artifact.
   * No longer a hand-authored fixture. The manifest carries the genuine
   * compilerId "risx-knowledge-compiler" and its corresponding hashes.
   *
   * EXPECTED: audit.id and evidenceSnapshot.contentHash for FDA-dependent runs
   * will differ from pre-Stage-4 runs. Clinical/exclusion behavior is unchanged.
   */
  function loadCompiledFdaPackage(raw: typeof COMPILED_FDA_PACKAGE_DATA): EvidencePackage<unknown> {
    return {
      manifest:   EvidencePackageManifestSchema.parse(raw.manifest),
      source:     raw.source,
      assertions: raw.assertions as EvidencePackage<unknown>["assertions"],
    };
  }

  export const FDA_DRUG_LABELS: EvidencePackage<unknown> =
    loadCompiledFdaPackage(COMPILED_FDA_PACKAGE_DATA);

  export const ALL_FIXTURE_PACKAGES = [
    AJCC_STAGING_MANUAL,
    BIOMARKER_DEFINITIONS,
    NCCN_NSCLC_GUIDELINES,
    FDA_DRUG_LABELS,
  ] as const;
  