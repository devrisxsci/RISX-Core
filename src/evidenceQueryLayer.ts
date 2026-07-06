import type { EvidenceAssertion, EvidencePackage, EvidenceQueryHandle, EvidenceSnapshot } from "./types.js";

/**
 * The Evidence Query Layer (Computational Core architecture, Section 18).
 *
 * "The Evidence Query Layer is the Core's sole interface to medical
 * knowledge. Modules never open an Evidence Package, never read a file, and
 * never reach the Evidence Repository directly." This class is that
 * boundary: it pins a snapshot of packages once, at construction, and every
 * query it serves for the lifetime of an execution is resolved against that
 * pinned snapshot (GR-16). Modules receive a narrow `EvidenceQueryHandle`,
 * never this class directly, so they cannot reach any package they were not
 * given a handle to query.
 */
export class EvidenceQueryLayer implements EvidenceQueryHandle {
  private readonly packagesById: ReadonlyMap<string, EvidencePackage>;

  private constructor(packagesById: ReadonlyMap<string, EvidencePackage>) {
    this.packagesById = packagesById;
  }

  static pin(packages: ReadonlyArray<EvidencePackage>): EvidenceQueryLayer {
    const map = new Map<string, EvidencePackage>();
    for (const pkg of packages) {
      map.set(pkg.manifest.packageId, pkg);
    }
    return new EvidenceQueryLayer(map);
  }

  snapshot(): EvidenceSnapshot {
    return {
      packages: [...this.packagesById.values()].map((p) => p.manifest)
    };
  }

  packageManifest(packageId: string) {
    const pkg = this.packagesById.get(packageId);
    if (!pkg) {
      throw new Error(`Evidence Query Layer: no pinned package registered for id "${packageId}".`);
    }
    return pkg.manifest;
  }

  queryAssertions<TClaim = unknown>(
    packageId: string,
    predicate?: (a: EvidenceAssertion<TClaim>) => boolean
  ): ReadonlyArray<EvidenceAssertion<TClaim>> {
    const pkg = this.packagesById.get(packageId);
    if (!pkg) {
      throw new Error(`Evidence Query Layer: no pinned package registered for id "${packageId}".`);
    }
    const assertions = pkg.assertions as ReadonlyArray<EvidenceAssertion<TClaim>>;
    return predicate ? assertions.filter(predicate) : assertions;
  }
}
