/**
   * AR1 Step 2: Compiled NCCN NSCLC Evidence Package artifact.
   *
   * This is the verbatim output of RISX-Knowledge-Compiler v1.0.0
   * (compilerId "risx-knowledge-compiler"), compiled on 2026-01-01 from the
   * three D1 canonical EvidenceObjects:
   *   - nccn-ev-egfr-ex19del-iv  (contentHash ad622229…)
   *   - nccn-ev-alk-fusion-iv    (contentHash 03c67294…)
   *   - nccn-ev-no-biomarker-iv  (contentHash 6025ea1a…)
   *
   * This file is the committed artifact RISX-Core loads instead of the
   * hand-authored NCCN fixture. It is produced once by the L4 compiler and
   * committed as a data artifact — it is NOT generated at build time.
   * See CHANGELOG.md for the AR1 Step 2 provenance record.
   *
   * manifestHash: 3fcf5489c460ca007c10544dc6edb7ac02bd0766ca512d8ca9de411b0579396e
   */

  type Sha256Hash = { algorithm: "sha256"; digest: string };

  interface AssertionData {
    assertionId: string;
    evidenceCategory: string;
    claim: {
      stageValue: string;
      biomarkerCode: string | null;
      recommendedRegimenId: string;
      therapies: string[];
      evidenceStrength: string;
    };
    citation: string;
  }

  export const COMPILED_NCCN_PACKAGE_DATA: {
    manifest: {
      objectType: "EvidencePackageManifest";
      packageKind: "evidence";
      packageId: string;
      version: string;
      compilerId: string;
      compilerVersion: string;
      headerHash: Sha256Hash;
      metadataHash: Sha256Hash;
      bodyHashes: Sha256Hash[];
      supportingResourceHashes: Sha256Hash[];
      manifestHash: Sha256Hash;
      signature: { signedBy: string; value: string };
      compatibleWith: string[];
      createdAt: string;
      evidenceObjectIds: string[];
      provenancePointers: string[];
    };
    source: string;
    assertions: AssertionData[];
  } = {
    manifest: {
      objectType: "EvidencePackageManifest",
      packageKind: "evidence",
      packageId: "nccn-nsclc-guidelines",
      version: "2026.3.0+NCCN-NSCLC",
      compilerId: "risx-knowledge-compiler",
      compilerVersion: "1.0.0",
      headerHash:   { algorithm: "sha256", digest: "ed06e3433f48297927318310508279b3179e885fbf12a78c7bce0426bd0e3d42" },
      metadataHash: { algorithm: "sha256", digest: "1fb5620fed82179fbc2baef2116b187465dd204bdb60dd18a222588382b69320" },
      bodyHashes: [
        { algorithm: "sha256", digest: "60337af2e15b945e60d321cf9d27b790e3635199c551d0f21f1a070ee8b70359" }
      ],
      supportingResourceHashes: [],
      manifestHash: { algorithm: "sha256", digest: "3fcf5489c460ca007c10544dc6edb7ac02bd0766ca512d8ca9de411b0579396e" },
      signature: {
        signedBy: "risx-knowledge-compiler",
        value:    "c91c791fa00683bf769351d59b090895e480cf3b8e313d023790349de8e15c47",
      },
      compatibleWith: ["1.0.0"],
      createdAt: "2026-01-01T00:00:00.000Z",
      evidenceObjectIds: [
        "nccn-ev-egfr-ex19del-iv",
        "nccn-ev-alk-fusion-iv",
        "nccn-ev-no-biomarker-iv",
      ],
      provenancePointers: ["NCCN Guidelines NSCLC v2026.3"],
    },
    source: "National Comprehensive Cancer Network",
    assertions: [
      {
        assertionId: "nccn-dp-egfr-ex19del-iv",
        evidenceCategory: "NCCN-Category-1",
        claim: {
          stageValue: "IV",
          biomarkerCode: "EGFR-EX19DEL",
          recommendedRegimenId: "osimertinib-monotherapy",
          therapies: ["osimertinib"],
          evidenceStrength: "NCCN-Category-1",
        },
        citation: "NCCN Guidelines NSCLC v2026.3, Systemic Therapy \u2014 EGFR-mutated",
      },
      {
        assertionId: "nccn-dp-alk-fusion-iv",
        evidenceCategory: "NCCN-Category-1",
        claim: {
          stageValue: "IV",
          biomarkerCode: "ALK-FUSION",
          recommendedRegimenId: "alectinib-monotherapy",
          therapies: ["alectinib"],
          evidenceStrength: "NCCN-Category-1",
        },
        citation: "NCCN Guidelines NSCLC v2026.3, Systemic Therapy \u2014 ALK-positive",
      },
      {
        assertionId: "nccn-dp-no-biomarker-iv",
        evidenceCategory: "NCCN-Category-1",
        claim: {
          stageValue: "IV",
          biomarkerCode: null,
          recommendedRegimenId: "carboplatin-pemetrexed-pembrolizumab",
          therapies: ["carboplatin", "pemetrexed", "pembrolizumab"],
          evidenceStrength: "NCCN-Category-1",
        },
        citation: "NCCN Guidelines NSCLC v2026.3, Systemic Therapy \u2014 no actionable driver",
      },
    ],
  };
  