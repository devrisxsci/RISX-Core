/**
   * AR1 Stage 4: Compiled FDA Drug Labels Evidence Package artifact.
   *
   * This is the verbatim output of RISX-Knowledge-Compiler v1.0.0
   * (compilerId "risx-knowledge-compiler"), compiled on 2026-01-01 from the
   * two D1 canonical EvidenceObjects:
   *   - fda-ev-pemetrexed-renal   (contentHash 5577a65f…)
   *   - fda-ev-osimertinib-cyp3a4 (contentHash 8c428331…)
   *
   * This file is the committed artifact RISX-Core loads instead of the
   * hand-authored FDA fixture. It is produced once by the L4 compiler and
   * committed as a data artifact — it is NOT generated at build time.
   * See CHANGELOG.md for the AR1 Stage 4 provenance record.
   *
   * manifestHash: a86571096a48ddf07b81455d2ec8255e2acca7f027d19814b686a90a211e39c2
   */

  type Sha256Hash = { algorithm: "sha256"; digest: string };

  interface AssertionData {
    assertionId: string;
    evidenceCategory: string;
    claim: {
      therapy: string;
      contraindicationRule: "medication-interaction" | "lab-gate";
      triggerCode: string;
      reason: string;
    };
    citation: string;
  }

  export const COMPILED_FDA_PACKAGE_DATA: {
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
      objectType:   "EvidencePackageManifest",
      packageKind:  "evidence",
      packageId:    "fda-drug-labels-nsclc",
      version:      "2026.5.0+FDA-Labels-2026-05",
      compilerId:   "risx-knowledge-compiler",
      compilerVersion: "1.0.0",
      headerHash:   { algorithm: "sha256", digest: "f576a4ea2b306a52c0a028d2ccda4edde615b48a294248ef10e733a70c6cb80e" },
      metadataHash: { algorithm: "sha256", digest: "1fb5620fed82179fbc2baef2116b187465dd204bdb60dd18a222588382b69320" },
      bodyHashes: [
        { algorithm: "sha256", digest: "3a1d14bb71b59fea95b1b8a2db76a133e0f0fc9f8fdbc596e9745ade7d30a2ae" },
      ],
      supportingResourceHashes: [],
      manifestHash: { algorithm: "sha256", digest: "a86571096a48ddf07b81455d2ec8255e2acca7f027d19814b686a90a211e39c2" },
      signature: {
        signedBy: "risx-knowledge-compiler",
        value:    "859f97a5093120fc88886b168c2aa633d8ec81da1dad8a264cc6dc853bbc72e2",
      },
      compatibleWith: ["1.0.0"],
      createdAt:      "2026-01-01T00:00:00.000Z",
      evidenceObjectIds: [
        "fda-ev-pemetrexed-renal",
        "fda-ev-osimertinib-cyp3a4",
      ],
      provenancePointers: [
        "FDA Prescribing Information, pemetrexed",
        "FDA Prescribing Information, osimertinib",
      ],
    },
    source: "U.S. Food and Drug Administration",
    assertions: [
      {
        assertionId:      "fda-pemetrexed-renal",
        evidenceCategory: "FDA-Label-Contraindication",
        claim: {
          therapy:              "pemetrexed",
          contraindicationRule: "lab-gate",
          triggerCode:          "CREATININE-CLEARANCE-LOW",
          reason:               "Pemetrexed is contraindicated with creatinine clearance below the labeled threshold.",
        },
        citation: "FDA Prescribing Information, pemetrexed, Contraindications",
      },
      {
        assertionId:      "fda-osimertinib-qt",
        evidenceCategory: "FDA-Label-Contraindication",
        claim: {
          therapy:              "osimertinib",
          contraindicationRule: "medication-interaction",
          triggerCode:          "STRONG-CYP3A4-INDUCER",
          reason:               "Osimertinib co-administration with strong CYP3A4 inducers is contraindicated per label.",
        },
        citation: "FDA Prescribing Information, osimertinib, Drug Interactions",
      },
    ],
  };
  