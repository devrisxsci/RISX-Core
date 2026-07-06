import type { ModuleRegistration, ModuleRunContext } from "./types.js";
import type { ModuleRegistry } from "./moduleRegistry.js";

/**
 * Module Orchestrator (Computational Core architecture, Sections 8, 9, 13, 14).
 *
 * Builds the execution DAG from registered modules' declared inputs/outputs
 * ("dependency resolution matches producers to consumers by typed contract",
 * Section 8.2), rejects cycles at planning time rather than discovering them
 * mid-run (GR-8), derives a topological order, and invokes each module in
 * that order (GR-12: "no module may bypass the Module Orchestrator" — every
 * module here is invoked exclusively through this class, never directly by
 * another module). Phase P2 has no independent parallel branches worth
 * scheduling concurrently in-process (the whole slice is one small DAG), so
 * execution here is sequential-by-topological-order; Section 14's
 * requirement is that a parallel schedule may never change the result, and
 * a sequential schedule trivially satisfies that as the reference reading
 * of the DAG.
 */

export interface PlannedNode {
  readonly moduleId: string;
  readonly dependsOn: ReadonlyArray<string>;
}

export class OrchestrationError extends Error {}

export class ModuleOrchestrator {
  constructor(private readonly registry: ModuleRegistry) {}

  /** Resolves producer -> consumer edges purely from declared contracts. */
  plan(moduleIds: ReadonlyArray<string>): ReadonlyArray<PlannedNode> {
    const modules = moduleIds.map((id) => this.registry.get(id));
    const producerByOutput = new Map<string, string>();
    for (const m of modules) {
      if (producerByOutput.has(m.declaredOutputs)) {
        throw new OrchestrationError(
          `Module Orchestrator: output "${m.declaredOutputs}" is produced by more than one registered module in this plan; resolution is not deterministic.`
        );
      }
      producerByOutput.set(m.declaredOutputs, m.moduleId);
    }

    const dependsOn = new Map<string, ReadonlyArray<string>>();
    for (const m of modules) {
      const deps: string[] = [];
      for (const input of m.declaredInputs) {
        const producer = producerByOutput.get(input);
        if (producer) {
          deps.push(producer);
        }
        // Inputs with no registered producer are assumed to be canonical
        // inputs or evidence, resolved outside the module graph — not a
        // planning error by itself.
      }
      dependsOn.set(m.moduleId, deps);
    }

    const order = topologicalSort(
      modules.map((m) => m.moduleId),
      dependsOn
    );

    return order.map((moduleId) => ({ moduleId, dependsOn: dependsOn.get(moduleId) ?? [] }));
  }

  /** Executes a planned DAG in topological order, sequentially. */
  execute(
    plan: ReadonlyArray<PlannedNode>,
    baseContext: Omit<ModuleRunContext, "upstream">
  ): ReadonlyMap<string, unknown> {
    const outputs = new Map<string, unknown>();
    for (const node of plan) {
      const registration = this.registry.get(node.moduleId) as ModuleRegistration<unknown, unknown>;
      const upstream = new Map<string, unknown>();
      for (const dep of node.dependsOn) {
        upstream.set(this.registry.get(dep).declaredOutputs, outputs.get(dep));
      }
      const result = registration.run(undefined as never, { ...baseContext, upstream });
      outputs.set(node.moduleId, result);
    }
    return outputs;
  }
}

function topologicalSort(nodeIds: ReadonlyArray<string>, dependsOn: ReadonlyMap<string, ReadonlyArray<string>>) {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new OrchestrationError(
        `Module Orchestrator: a cycle was detected in the execution graph at module "${id}". Cycles are rejected at planning time (GR-8), never resolved at runtime.`
      );
    }
    visiting.add(id);
    for (const dep of dependsOn.get(id) ?? []) {
      visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }

  for (const id of nodeIds) {
    visit(id);
  }
  return order;
}
