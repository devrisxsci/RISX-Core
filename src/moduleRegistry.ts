import type { ModuleRegistration } from "./types.js";

/**
 * Module Registry (Computational Core architecture, Section 11).
 *
 * "A module becomes known to the Core only by registration in the Module
 * Registry." Registration is validated at registration time, not deferred
 * to execution (Section 11): duplicate module ids/versions and malformed
 * declared-output identifiers are rejected immediately. Lifecycle (Section
 * 12: REGISTERED -> VALIDATED -> ACTIVE -> DEPRECATED -> RETIRED) is
 * modeled minimally for Phase P2 — every module registered in this phase is
 * immediately ACTIVE, since Phase P2 introduces no deprecation/retirement
 * scenario; the state machine is still explicit so a later phase can extend
 * it without changing this component (GR-42, "extension never touches the
 * engine").
 */

export type ModuleLifecycleState = "REGISTERED" | "VALIDATED" | "ACTIVE" | "DEPRECATED" | "RETIRED";

interface RegistryEntry {
  readonly registration: ModuleRegistration<any, any>;
  state: ModuleLifecycleState;
}

export class ModuleRegistrationError extends Error {}

export class ModuleRegistry {
  private readonly entries = new Map<string, RegistryEntry>();

  register<TInputs, TOutput>(registration: ModuleRegistration<TInputs, TOutput>): void {
    if (this.entries.has(registration.moduleId)) {
      throw new ModuleRegistrationError(
        `Module Registry: a module is already registered under id "${registration.moduleId}".`
      );
    }
    if (registration.declaredOutputs.trim().length === 0) {
      throw new ModuleRegistrationError(
        `Module Registry: module "${registration.moduleId}" declares an empty output identifier, which is malformed.`
      );
    }
    this.entries.set(registration.moduleId, { registration, state: "VALIDATED" });
    // No further validation deferred to execution for Phase P2: activate immediately.
    this.entries.get(registration.moduleId)!.state = "ACTIVE";
  }

  active(): ReadonlyArray<ModuleRegistration<any, any>> {
    return [...this.entries.values()]
      .filter((e) => e.state === "ACTIVE")
      .map((e) => e.registration);
  }

  get(moduleId: string): ModuleRegistration<any, any> {
    const entry = this.entries.get(moduleId);
    if (!entry) {
      throw new ModuleRegistrationError(`Module Registry: no module registered under id "${moduleId}".`);
    }
    return entry.registration;
  }

  stateOf(moduleId: string): ModuleLifecycleState {
    return this.get(moduleId) && this.entries.get(moduleId)!.state;
  }
}
