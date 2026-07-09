import type { ModuleRegistration, ModuleRunContext } from "../types.js";
import type { DrugCostResolution, RegimenCostSummary } from "../types.js";
import type { RegimenSelectionOutput } from "./regimenSelection.js";
import type {
  ContentHash,
  DrugIdentityClaim,
  CmsMedicareEconomicClaim,
} from "@risx/common";

/**
 * Economic Cost Resolution Module — Stage 3 (DrugIdentity FINALE).
 *
 * Purpose: resolve each ranked regimen's NCCN generic drug names to a real
 * CMS Medicare payment limit, via the two-hop chain:
 *
 *   RankedRegimen.therapies[] (NCCN generic name)
 *     → DrugIdentityClaim.genericName  (Drug-Identity Evidence Package)
 *       → hcpcsCodes[]
 *         → CmsMedicareEconomicClaim.hcpcsCode  (CMS Economic Evidence Package)
 *           → paymentLimitMicroUsd
 *
 * NON-NEGOTIABLE — real data only:
 *  - No drug-identity match, empty hcpcsCodes, or no economic assertion for a
 *    resolved HCPCS code ⇒ that drug's cost is ABSENT (paymentLimitMicroUsd
 *    null, absenceReason set). Never fabricated, never zero-filled.
 *  - A regimen with ANY absent drug cost is `complete: false` and its
 *    `totalMicroUsd` is `null` (a partial total would be misleading).
 *
 * This module is ADDITIVE. It reads two Evidence Packages and produces a
 * cost annotation only. It does NOT rank, re-rank, filter, or exclude any
 * regimen — ranking remains evidenceStrength-only in the Recommendation
 * Generation Module. Deterministic processing order: after Regimen Selection,
 * before Recommendation Generation.
 *
 * Claim shapes (DrugIdentityClaim, CmsMedicareEconomicClaim) are imported from
 * the shared @risx/common contract (ADR-0006) — the single source of truth for
 * what the Knowledge Compiler produces and what this module reads. No
 * module-local copies of the governed claim shapes.
 */

const DRUG_IDENTITY_PACKAGE_ID = "drug-identity-nsclc";
const ECONOMIC_PACKAGE_ID = "cms-economic-pricing-nsclc";

export interface EconomicCostResolutionOutput {
  readonly regimenCosts: ReadonlyArray<RegimenCostSummary>;
  readonly drugIdentityPackageVersion: string;
  readonly drugIdentityPackageContentHash: ContentHash;
  readonly economicPackageVersion: string;
  readonly economicPackageContentHash: ContentHash;
}

function resolveDrugCost(
  therapy: string,
  drugIdentity: ReadonlyArray<{ claim: DrugIdentityClaim }>,
  economic: ReadonlyArray<{ claim: CmsMedicareEconomicClaim }>
): DrugCostResolution {
  const identity = drugIdentity.find((a) => a.claim.genericName === therapy);
  if (!identity) {
    return {
      therapy,
      resolved: false,
      rxcui: null,
      hcpcsCode: null,
      paymentLimitMicroUsd: null,
      source: null,
      effectiveDate: null,
      effectiveThrough: null,
      absenceReason: "no drug-identity assertion for this generic name",
    };
  }

  if (identity.claim.hcpcsCodes.length === 0) {
    return {
      therapy,
      resolved: false,
      rxcui: identity.claim.rxcui,
      hcpcsCode: null,
      paymentLimitMicroUsd: null,
      source: null,
      effectiveDate: null,
      effectiveThrough: null,
      absenceReason: "drug identity resolved but no HCPCS code (no CMS ASP crosswalk)",
    };
  }

  // A drug resolves to at least one HCPCS code; take the first economic
  // assertion whose hcpcsCode matches any of the drug's codes. Deterministic:
  // iterate the drug's codes in order and use the first with a price.
  for (const hcpcs of identity.claim.hcpcsCodes) {
    const price = economic.find((a) => a.claim.hcpcsCode === hcpcs);
    if (price) {
      return {
        therapy,
        resolved: true,
        rxcui: identity.claim.rxcui,
        hcpcsCode: price.claim.hcpcsCode,
        paymentLimitMicroUsd: price.claim.paymentLimitMicroUsd,
        source: price.claim.source,
        effectiveDate: price.claim.effectiveDate,
        effectiveThrough: price.claim.effectiveThrough,
        absenceReason: null,
      };
    }
  }

  return {
    therapy,
    resolved: false,
    rxcui: identity.claim.rxcui,
    hcpcsCode: identity.claim.hcpcsCodes[0] ?? null,
    paymentLimitMicroUsd: null,
    source: null,
    effectiveDate: null,
    effectiveThrough: null,
    absenceReason: "HCPCS code resolved but no CMS economic assertion for it",
  };
}

export function runEconomicCostResolutionModule(ctx: ModuleRunContext): EconomicCostResolutionOutput {
  const regimenSelection = ctx.upstream.get("knowledge:RankedRegimen") as RegimenSelectionOutput | undefined;
  if (!regimenSelection) {
    throw new Error("Economic Cost Resolution Module: upstream Regimen Selection Module output was not available.");
  }

  const drugIdentityManifest = ctx.evidence.packageManifest(DRUG_IDENTITY_PACKAGE_ID);
  const economicManifest = ctx.evidence.packageManifest(ECONOMIC_PACKAGE_ID);
  const drugIdentity = ctx.evidence.queryAssertions<DrugIdentityClaim>(DRUG_IDENTITY_PACKAGE_ID);
  const economic = ctx.evidence.queryAssertions<CmsMedicareEconomicClaim>(ECONOMIC_PACKAGE_ID);

  const regimenCosts: RegimenCostSummary[] = regimenSelection.rankedRegimens.map((regimen) => {
    const drugCosts = regimen.therapies.map((therapy) => resolveDrugCost(therapy, drugIdentity, economic));
    const complete = drugCosts.every((c) => c.resolved);
    const totalMicroUsd = complete
      ? drugCosts.reduce((sum, c) => {
          // Invariant: a `resolved` drug cost always carries a real price.
          // Never silently zero-fill — surface malformed evidence as a defect.
          if (c.paymentLimitMicroUsd === null) {
            throw new Error(
              `Economic cost resolution: drug "${c.therapy}" is marked resolved but has a null payment limit; refusing to zero-fill a fabricated total.`
            );
          }
          return sum + c.paymentLimitMicroUsd;
        }, 0)
      : null;
    return {
      regimenId: regimen.regimenId,
      drugCosts,
      totalMicroUsd,
      complete,
    };
  });

  return {
    regimenCosts,
    drugIdentityPackageVersion: drugIdentityManifest.version,
    drugIdentityPackageContentHash: drugIdentityManifest.manifestHash,
    economicPackageVersion: economicManifest.version,
    economicPackageContentHash: economicManifest.manifestHash,
  };
}

export const economicCostResolutionModuleRegistration: ModuleRegistration<undefined, EconomicCostResolutionOutput> = {
  moduleId: "economic-cost-resolution-module",
  version: "1.0.0",
  domain: "clinical.nsclc",
  declaredInputs: ["knowledge:RankedRegimen"],
  declaredOutputs: "knowledge:RegimenCosts",
  confidenceProfile: ["evidenceStrength"],
  deterministic: true,
  requiresInjectedRandomness: false,
  run: (_inputs, ctx) => runEconomicCostResolutionModule(ctx),
};
