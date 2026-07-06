import { z } from "zod";
import type { CanonicalObjectEnvelope } from "./types.js";

/**
 * Canonical Input Gateway (Computational Core architecture, Section 17).
 *
 * "The Canonical Input Gateway validates every inbound object against
 * RISX-Common schemas and rejects anything that is not a valid canonical
 * object at the boundary." RISX-Common does not exist yet, and no
 * repository has been approved to own these schemas (ADR-0001, still open).
 * The schemas below are therefore LOCAL and PROVISIONAL — the minimum shape
 * this phase's five clinical modules need, drawn directly from the
 * Canonical Object Inventory in the NSCLC Enterprise Knowledge Slice
 * specification (Section 3). They are not a claim that RISX-Core owns or is
 * proposing to own the canonical schema; that decision remains with
 * ADR-0001. Ownership aside, the *behavior* required of this gateway by the
 * governing architecture is implemented faithfully: validate at the
 * boundary, reject anything invalid, admit nothing else.
 */

const PatientSchema = z.object({
  patientId: z.string().min(1)
});

const DiagnosisSchema = z.object({
  patientId: z.string().min(1),
  diseaseCode: z.string().min(1),
  confirmationStatus: z.enum(["working", "confirmed"])
});

const DiseaseStageInputSchema = z.object({
  diagnosisId: z.string().min(1),
  tCategory: z.string().min(1),
  nCategory: z.string().min(1),
  mCategory: z.string().min(1)
});

const HistologySchema = z.object({
  diagnosisId: z.string().min(1),
  classificationSystem: z.literal("CAP/IASLC"),
  classificationValue: z.string().min(1)
});

const ImagingSummarySchema = z.object({
  diagnosisId: z.string().min(1),
  imagingDateIso: z.string().min(1),
  structuredFinding: z.string().min(1)
});

const BiomarkerResultsSchema = z.object({
  diagnosisId: z.string().min(1),
  assayId: z.string().min(1),
  rawResultCode: z.string().min(1),
  resultDateIso: z.string().min(1)
});

const TreatmentHistoryEntrySchema = z.object({
  patientId: z.string().min(1),
  lineOfTherapyOrdinal: z.number().int().positive(),
  priorRegimenId: z.string().min(1).nullable()
});

const LaboratoryResultSchema = z.object({
  patientId: z.string().min(1),
  labTestCode: z.string().min(1),
  resultValue: z.number(),
  resultDateIso: z.string().min(1)
});

const EcogPerformanceStatusSchema = z.object({
  patientId: z.string().min(1),
  ecogScore: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  assessmentDateIso: z.string().min(1)
});

const MedicationListEntrySchema = z.object({
  patientId: z.string().min(1),
  medicationCode: z.string().min(1),
  status: z.enum(["active", "inactive"])
});

export const CANONICAL_OBJECT_SCHEMAS = {
  Patient: PatientSchema,
  Diagnosis: DiagnosisSchema,
  DiseaseStage: DiseaseStageInputSchema,
  Histology: HistologySchema,
  ImagingSummary: ImagingSummarySchema,
  BiomarkerResults: BiomarkerResultsSchema,
  TreatmentHistoryEntry: TreatmentHistoryEntrySchema,
  LaboratoryResult: LaboratoryResultSchema,
  EcogPerformanceStatus: EcogPerformanceStatusSchema,
  MedicationListEntry: MedicationListEntrySchema
} as const;

export type CanonicalObjectType = keyof typeof CANONICAL_OBJECT_SCHEMAS;

export class CanonicalInputRejectedError extends Error {
  constructor(
    readonly canonicalObjectType: string,
    readonly id: string,
    readonly issues: string
  ) {
    super(`Canonical Input Gateway rejected object "${id}" of type "${canonicalObjectType}": ${issues}`);
    this.name = "CanonicalInputRejectedError";
  }
}

/**
 * Admits a set of raw candidate canonical objects. Every object is validated
 * against its declared type's schema; the first invalid object causes the
 * whole admission to fail (GR-14, "fail whole, never partial" — extended
 * here to admission, since a partially-admitted input set could not be
 * fully audited either).
 */
export function admitCanonicalInputs(
  candidates: ReadonlyArray<{ canonicalObjectType: CanonicalObjectType; id: string; payload: unknown }>
): ReadonlyMap<string, CanonicalObjectEnvelope> {
  const admitted = new Map<string, CanonicalObjectEnvelope>();
  for (const candidate of candidates) {
    const schema = CANONICAL_OBJECT_SCHEMAS[candidate.canonicalObjectType];
    const result = schema.safeParse(candidate.payload);
    if (!result.success) {
      throw new CanonicalInputRejectedError(
        candidate.canonicalObjectType,
        candidate.id,
        result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
      );
    }
    admitted.set(candidate.id, {
      canonicalObjectType: candidate.canonicalObjectType,
      id: candidate.id,
      payload: result.data
    });
  }
  return admitted;
}
