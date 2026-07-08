/**
 * A2 Step: Compiled Biomarker Definitions Evidence Package artifact.
 *
 * This is the verbatim output of RISX-Knowledge-Compiler v1.0.0
 * (compilerId "risx-knowledge-compiler"), compiled on 2026-01-01 from the
 * two D1 canonical EvidenceObjects:
 *   - biomarker-ev-egfr-ex19del  (contentHash aa569ddc…)
 *   - biomarker-ev-alk-fusion    (contentHash aa569ddc…, shared bodyHash tree)
 *
 * This file is the committed artifact RISX-Core loads instead of the
 * hand-authored BIOMARKER_DEFINITIONS fixture. It is produced once by the
 * L4 compiler and committed as a data artifact — it is NOT generated at
 * build time. See CHANGELOG.md for the A2 cutover provenance record.
 *
 * The claim shape is the shared @risx/common `BiomarkerClaim` — narrower
 * than the retired fixture's `BiomarkerDefinitionClaim`: `displayName` and
 * `positivityThreshold` are dropped (confirmed unread anywhere in RISX-Core
 * prior to authoring the shared shape, per ADR-0006, EP-28).
 *
 * manifestHash: c8cdfac7efafdeca20a4be4adcc1e7cc04861f7956d968b51d002366ef19cbfc
 */

type Sha256Hash = { algorithm: "sha256"; digest: string };

interface AssertionData {
  assertionId: string;
  evidenceCategory: string;
  claim: {
    biomarkerCode: string;
    molecularAlteration: string;
  };
  citation: string;
}

export const COMPILED_BIOMARKER_PACKAGE_DATA: {
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
    packageId: "biomarker-definitions",
    version: "2026.1.0+Biomarker-Definitions-2026-01",
    compilerId: "risx-knowledge-compiler",
    compilerVersion: "1.0.0",
    headerHash:   { algorithm: "sha256", digest: "f89353ac2985b7755994ec4f85dd042d93e6e7f49369214d6f887f7ed15abda7" },
    metadataHash: { algorithm: "sha256", digest: "1fb5620fed82179fbc2baef2116b187465dd204bdb60dd18a222588382b69320" },
    bodyHashes: [
      { algorithm: "sha256", digest: "aa569ddc858b390d5925c4cd5f2b7afeb319432b61572fe985b3f5e120efcc79" }
    ],
    supportingResourceHashes: [],
    manifestHash: { algorithm: "sha256", digest: "c8cdfac7efafdeca20a4be4adcc1e7cc04861f7956d968b51d002366ef19cbfc" },
    signature: {
      signedBy: "risx-knowledge-compiler",
      value:    "534589479b4fe7e134ac004b3105d9bbe63708101c9aacb2e4ee13d4731f8469",
    },
    compatibleWith: ["1.0.0"],
    createdAt: "2026-01-01T00:00:00.000Z",
    evidenceObjectIds: [
      "biomarker-ev-egfr-ex19del",
      "biomarker-ev-alk-fusion",
    ],
    provenancePointers: ["Biomarker Definitions v2026.1"],
  },
  source: "Biomarker Definitions Curators",
  assertions: [
    {
      assertionId: "biomarker-egfr-ex19del",
      evidenceCategory: "Curated-Actionable",
      claim: {
        biomarkerCode: "EGFR-EX19DEL",
        molecularAlteration: "EGFR exon 19 deletion",
      },
      citation: "Biomarker Definitions v2026.1, EGFR panel",
    },
    {
      assertionId: "biomarker-alk-fusion",
      evidenceCategory: "Curated-Actionable",
      claim: {
        biomarkerCode: "ALK-FUSION",
        molecularAlteration: "ALK gene rearrangement",
      },
      citation: "Biomarker Definitions v2026.1, ALK panel",
    },
  ],
};
