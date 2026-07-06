import { describe, expect, it } from "vitest";
import { ModuleRegistry, ModuleRegistrationError } from "../src/moduleRegistry.js";
import { ModuleOrchestrator, OrchestrationError } from "../src/moduleOrchestrator.js";
import { buildClinicalRegistry } from "../src/analyticsRuntime.js";
import type { ModuleRegistration } from "../src/types.js";

function stubModule(id: string, inputs: string[], output: string): ModuleRegistration<undefined, string> {
  return {
    moduleId: id,
    version: "1.0.0",
    domain: "test",
    declaredInputs: inputs,
    declaredOutputs: output,
    confidenceProfile: [],
    deterministic: true,
    requiresInjectedRandomness: false,
    run: () => id
  };
}

describe("Module Registry", () => {
  it("rejects duplicate registration under the same module id (GR: no re-registration)", () => {
    const registry = new ModuleRegistry();
    registry.register(stubModule("m1", [], "out:1"));
    expect(() => registry.register(stubModule("m1", [], "out:2"))).toThrow(ModuleRegistrationError);
  });

  it("activates a validly registered module immediately in Phase P2", () => {
    const registry = new ModuleRegistry();
    registry.register(stubModule("m1", [], "out:1"));
    expect(registry.stateOf("m1")).toBe("ACTIVE");
  });
});

describe("Module Orchestrator", () => {
  it("plans a correct topological order for the real NSCLC clinical pipeline", () => {
    const registry = buildClinicalRegistry();
    const orchestrator = new ModuleOrchestrator(registry);
    const plan = orchestrator.plan([
      "recommendation-generation-module",
      "staging-module",
      "regimen-selection-module",
      "guideline-matching-module",
      "biomarker-interpretation-module"
    ]);
    const order = plan.map((p) => p.moduleId);
    expect(order.indexOf("staging-module")).toBeLessThan(order.indexOf("guideline-matching-module"));
    expect(order.indexOf("biomarker-interpretation-module")).toBeLessThan(order.indexOf("guideline-matching-module"));
    expect(order.indexOf("guideline-matching-module")).toBeLessThan(order.indexOf("regimen-selection-module"));
    expect(order.indexOf("regimen-selection-module")).toBeLessThan(order.indexOf("recommendation-generation-module"));
  });

  it("rejects a cyclic module graph at planning time, never at runtime (GR-8)", () => {
    const registry = new ModuleRegistry();
    registry.register(stubModule("a", ["out:b"], "out:a"));
    registry.register(stubModule("b", ["out:a"], "out:b"));
    const orchestrator = new ModuleOrchestrator(registry);
    expect(() => orchestrator.plan(["a", "b"])).toThrow(OrchestrationError);
  });

  it("rejects a plan where two modules claim the same output (non-deterministic resolution)", () => {
    const registry = new ModuleRegistry();
    registry.register(stubModule("a", [], "out:shared"));
    registry.register(stubModule("b", [], "out:shared"));
    const orchestrator = new ModuleOrchestrator(registry);
    expect(() => orchestrator.plan(["a", "b"])).toThrow(OrchestrationError);
  });
});
