/**
   * A3 Step: Compiled AJCC Staging Manual Evidence Package artifact.
   *
   * This is the verbatim output of RISX-Knowledge-Compiler v1.0.0
   * (compilerId "risx-knowledge-compiler"), compiled on 2026-01-01 from the
   * two D1 canonical EvidenceObjects:
   *   - ajcc-ev-iiia  (T2/N2/M0 → Stage IIIA)
   *   - ajcc-ev-iv    (T4/N3/M1 → Stage IV)
   *
   * This file is the committed artifact RISX-Core loads instead of the
   * hand-authored AJCC_STAGING_MANUAL fixture. It is produced once by the
   * L4 compiler and committed as a data artifact — it is NOT generated at
   * build time. See CHANGELOG.md for the A3 cutover provenance record.
   *
   * The claim shape is the shared @risx/common `AjccStagingClaim`:
   * stageValue, tCategory, nCategory, mCategory (4 fields; only fields
   * read by staging.ts per ADR-0006, EP-28).
   *
   * CHANGELOG note: edition is now explicit in the AJCC evidence (deliberate
   * enrichment — provenance documentId carries "AJCC Cancer Staging Manual,
   * 8th Edition"). AJCC evidenceSnapshot hash changes (genuine compiler
   * identity replaces the fixture placeholder). Clinical output does not
   * change — breaking-provenance-not-reasoning.
   *
   * manifestHash: 2b3e197ef1ebfeda00c9322b5d9cb153880b87f609a59c94266b1e4847d81f80
   */

  type Sha256Hash = { algorithm: "sha256"; digest: string };

  interface AjccAssertionData {
    assertionId: string;
    evidenceCategory: string;
    claim: {
      stageValue: string;
      tCategory:  string;
      nCategory:  string;
      mCategory:  string;
    };
    citation: string;
  }

  export const COMPILED_AJCC_PACKAGE_DATA: {
    manifest: {
      objectType:               "EvidencePackageManifest";
      packageKind:              "evidence";
      packageId:                string;
      version:                  string;
      compilerId:               string;
      compilerVersion:          string;
      headerHash:               Sha256Hash;
      metadataHash:             Sha256Hash;
      bodyHashes:               Sha256Hash[];
      supportingResourceHashes: Sha256Hash[];
      manifestHash:             Sha256Hash;
      signature:                { signedBy: string; value: string };
      compatibleWith:           string[];
      createdAt:                string;
      evidenceObjectIds:        string[];
      provenancePointers:       string[];
    };
    source:      string;
    assertions:  AjccAssertionData[];
  } = {
    manifest: {
      objectType:               "EvidencePackageManifest",
      packageKind:              "evidence",
      packageId:                "ajcc-staging-manual",
      version:                  "8.0.0+AJCC-8th-Edition",
      compilerId:               "risx-knowledge-compiler",
      compilerVersion:          "1.0.0",
      headerHash:   { algorithm: "sha256", digest: "460125909792f027975b7234ceb31c24e7a309d777c75bc4b56eb04f794e4fe1" },
      metadataHash: { algorithm: "sha256", digest: "1fb5620fed82179fbc2baef2116b187465dd204bdb60dd18a222588382b69320" },
      bodyHashes: [
        { algorithm: "sha256", digest: "5e6d30c4370806fbdae44c3f97f69a4eaf5c7112e7af30449e731dcf5d3456c1" },
      ],
      supportingResourceHashes: [],
      manifestHash: { algorithm: "sha256", digest: "2b3e197ef1ebfeda00c9322b5d9cb153880b87f609a59c94266b1e4847d81f80" },
      signature: {
        signedBy: "risx-knowledge-compiler",
        value:    "7213a26fe6696fc64da52345dc5f79b117c2d2d141341abba801d20897d3bca8",
      },
      compatibleWith:    ["1.0.0"],
      createdAt:         "2026-01-01T00:00:00.000Z",
      evidenceObjectIds: ["ajcc-ev-iiia", "ajcc-ev-iv"],
      provenancePointers: ["AJCC Cancer Staging Manual, 8th Edition"],
    },
    source:     "American Joint Committee on Cancer",
    assertions: [
      {
        assertionId:      "ajcc-iiia",
        evidenceCategory: "AJCC-8-Definitive",
        claim: { stageValue: "IIIA", tCategory: "T2", nCategory: "N2", mCategory: "M0" },
        citation: "AJCC Cancer Staging Manual, 8th Edition, Lung Cancer chapter",
      },
      {
        assertionId:      "ajcc-iv",
        evidenceCategory: "AJCC-8-Definitive",
        claim: { stageValue: "IV", tCategory: "T4", nCategory: "N3", mCategory: "M1" },
        citation: "AJCC Cancer Staging Manual, 8th Edition, Lung Cancer chapter",
      },
    ],
  };
  