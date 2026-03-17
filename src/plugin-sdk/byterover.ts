// Narrow plugin-sdk surface for the bundled byterover context engine plugin.
// Keep this list additive and scoped to symbols used under extensions/byterover.

export type { OpenClawPluginApi, PluginLogger } from "../plugins/types.js";
export type {
  ContextEngine,
  ContextEngineInfo,
  ContextEngineRuntimeContext,
  AssembleResult,
  CompactResult,
  IngestResult,
} from "../context-engine/types.js";
export { delegateCompactionToRuntime } from "../context-engine/delegate-compaction.runtime.js";
export type { DelegateCompactionParams } from "../context-engine/delegate-compaction.runtime.js";
