import type { ExecutionContext } from "../src/types.js";
import type { CanonicalObjectType } from "../src/canonicalInputGateway.js";

// Policy version identifiers — semantic versions, conforming to Common's
// AuditObjectSchema (SemanticVersionSchema on precedencePolicyVersion and
// confidencePolicyVersion, audit-object.ts:84/:86). The sealed value
// identifies the version; these constants and comments document what each
// version MEANS. AuditObject is strict (additionalProperties:false) — the
// description cannot travel inside it and is deliberately kept out.

// 0.1.0-single-domain — single-domain precedence ordering: only one evidence
// domain is consulted per decision point, so no cross-domain precedence
// arbitration is performed. 0.x.y signals a provisional/unstable policy.
export const PRECEDENCE_POLICY_VERSION = "0.1.0-single-domain";

// 0.1.0-provisional-unweighted-mean.pending-adr-0002 — unweighted-mean
// confidence aggregation. The final aggregation rule remains OPEN, deferred
// to ADR-0002 Part B; this versions the policy without deciding it. The
// prerelease field carries the full original semantics.
export const CONFIDENCE_POLICY_VERSION =
  "0.1.0-provisional-unweighted-mean.pending-adr-0002";

export const BASE_EXECUTION_CONTEXT: ExecutionContext = {
  injectedTimeIso: "2026-07-06T00:00:00.000Z",
  randomSeed: "test-seed-0001",
  tenantId: "test-tenant",
  precedencePolicyVersion: PRECEDENCE_POLICY_VERSION,
  confidencePolicyVersion: CONFIDENCE_POLICY_VERSION,
  intendedUsePosture: "clinical-decision-support-eligible"
};

export function egfrPositiveStageIVInputs(): ReadonlyArray<{
  canonicalObjectType: CanonicalObjectType;
  id: string;
  payload: unknown;
}> {
  return [
    { canonicalObjectType: "Patient", id: "patient-1", payload: { patientId: "patient-1" } },
    {
      canonicalObjectType: "Diagnosis",
      id: "diagnosis-1",
      payload: { patientId: "patient-1", diseaseCode: "NSCLC-ADENOCARCINOMA", confirmationStatus: "confirmed" }
    },
    {
      canonicalObjectType: "DiseaseStage",
      id: "disease-stage-1",
      payload: { diagnosisId: "diagnosis-1", tCategory: "T4", nCategory: "N3", mCategory: "M1" }
    },
    {
      canonicalObjectType: "ImagingSummary",
      id: "imaging-1",
      payload: { diagnosisId: "diagnosis-1", imagingDateIso: "2026-06-01T00:00:00.000Z", structuredFinding: "distant metastasis confirmed" }
    },
    {
      canonicalObjectType: "Histology",
      id: "histology-1",
      payload: { diagnosisId: "diagnosis-1", classificationSystem: "CAP/IASLC", classificationValue: "adenocarcinoma" }
    },
    {
      canonicalObjectType: "BiomarkerResults",
      id: "biomarker-result-1",
      payload: {
        diagnosisId: "diagnosis-1",
        assayId: "ngs-panel-1",
        rawResultCode: "EGFR-EX19DEL",
        resultDateIso: "2026-06-02T00:00:00.000Z"
      }
    },
    {
      canonicalObjectType: "EcogPerformanceStatus",
      id: "ecog-1",
      payload: { patientId: "patient-1", ecogScore: 1, assessmentDateIso: "2026-06-01T00:00:00.000Z" }
    },
    {
      canonicalObjectType: "MedicationListEntry",
      id: "medication-1",
      payload: { patientId: "patient-1", medicationCode: "METFORMIN", status: "active" }
    },
    {
      canonicalObjectType: "LaboratoryResult",
      id: "lab-1",
      payload: {
        patientId: "patient-1",
        labTestCode: "CREATININE-CLEARANCE-LOW",
        resultValue: 0.9,
        resultDateIso: "2026-06-01T00:00:00.000Z"
      }
    }
  ];
}
