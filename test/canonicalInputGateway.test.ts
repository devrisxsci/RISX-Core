import { describe, expect, it } from "vitest";
import { admitCanonicalInputs, CanonicalInputRejectedError } from "../src/canonicalInputGateway.js";

describe("Canonical Input Gateway", () => {
  it("admits a well-formed candidate", () => {
    const admitted = admitCanonicalInputs([
      { canonicalObjectType: "Patient", id: "p1", payload: { patientId: "p1" } }
    ]);
    expect(admitted.size).toBe(1);
    expect(admitted.get("p1")?.canonicalObjectType).toBe("Patient");
  });

  it("rejects an object that does not conform to its declared schema", () => {
    expect(() =>
      admitCanonicalInputs([{ canonicalObjectType: "Patient", id: "p1", payload: { patientId: "" } }])
    ).toThrow(CanonicalInputRejectedError);
  });

  it("rejects a Diagnosis with a confirmation status outside the closed set (GR: no free text)", () => {
    expect(() =>
      admitCanonicalInputs([
        {
          canonicalObjectType: "Diagnosis",
          id: "d1",
          payload: { patientId: "p1", diseaseCode: "NSCLC", confirmationStatus: "maybe" }
        }
      ])
    ).toThrow(CanonicalInputRejectedError);
  });

  it("fails the whole admission when any one object is invalid, admitting nothing partially", () => {
    expect(() =>
      admitCanonicalInputs([
        { canonicalObjectType: "Patient", id: "p1", payload: { patientId: "p1" } },
        { canonicalObjectType: "Patient", id: "p2", payload: { patientId: "" } }
      ])
    ).toThrow(CanonicalInputRejectedError);
  });
});
