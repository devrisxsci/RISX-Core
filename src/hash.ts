import { createHash } from "node:crypto";

/**
 * Canonical, deterministic JSON serialization: object keys are sorted
 * recursively so that two structurally-identical values always serialize to
 * the same bytes, regardless of construction order. This is required for
 * stable content hashing (Evidence Package Specification, Section 21 —
 * "serialization is canonical and deterministic").
 */
export function canonicalStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0
    );
    const sorted: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      sorted[k] = sortKeysDeep(v);
    }
    return sorted;
  }
  return value;
}

export function sha256Hex(value: unknown): string {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}
