import type { ExecutionContext } from "../src/types.js";
import type { CanonicalObjectType } from "../src/canonicalInputGateway.js";

export const BASE_EXECUTION_CONTEXT: ExecutionContext = {
  injectedTimeIso: "2026-07-06T00:00:00.000Z",
  randomSeed: "test-seed-0001",
  tenantId: "test-tenant",
  precedencePolicyVersion: "precedence-v0-single-domain",
  confidencePolicyVersion: "provisional-unweighted-mean-v0-pending-ADR-0002",
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
