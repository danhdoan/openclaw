import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { registerContextEngineForOwner } from "./registry.js";
import type {
  ContextEngine,
  ContextEngineInfo,
  ContextEngineRuntimeContext,
  AssembleResult,
  CompactResult,
  IngestResult,
} from "./types.js";

/**
 * LegacyContextEngine wraps the existing compaction behavior behind the
 * ContextEngine interface, preserving 100% backward compatibility.
 *
 * - ingest: no-op (SessionManager handles message persistence)
 * - assemble: pass-through (existing sanitize/validate/limit pipeline in attempt.ts handles this)
 * - compact: delegates to compactEmbeddedPiSessionDirect
 */
export class LegacyContextEngine implements ContextEngine {
  readonly info: ContextEngineInfo = {
    id: "legacy",
    name: "Legacy Context Engine",
    version: "1.0.0",
  };

  async ingest(_params: {
    sessionId: string;
    sessionKey?: string;
    message: AgentMessage;
    isHeartbeat?: boolean;
  }): Promise<IngestResult> {
    // No-op: SessionManager handles message persistence in the legacy flow
    return { ingested: false };
  }

  async assemble(params: {
    sessionId: string;
    sessionKey?: string;
    messages: AgentMessage[];
    tokenBudget?: number;
  }): Promise<AssembleResult> {
    // Pass-through: the existing sanitize -> validate -> limit -> repair pipeline
    // in attempt.ts handles context assembly for the legacy engine.
    // We just return the messages as-is with a rough token estimate.
    return {
      messages: params.messages,
      estimatedTokens: 0, // Caller handles estimation
    };
  }

  async afterTurn(_params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    messages: AgentMessage[];
    prePromptMessageCount: number;
    autoCompactionSummary?: string;
    isHeartbeat?: boolean;
    tokenBudget?: number;
    runtimeContext?: ContextEngineRuntimeContext;
  }): Promise<void> {
    // No-op: legacy flow persists context directly in SessionManager.
  }

  async compact(params: Parameters<ContextEngine["compact"]>[0]): Promise<CompactResult> {
    // Delegate to the shared runtime boundary so the lazy edge remains effective.
    const { delegateCompactionToRuntime } = await import("./delegate-compaction.runtime.js");
    return delegateCompactionToRuntime(params);
  }

  async dispose(): Promise<void> {
    // Nothing to clean up for legacy engine
  }
}

export function registerLegacyContextEngine(): void {
  registerContextEngineForOwner("legacy", () => new LegacyContextEngine(), "core", {
    allowSameOwnerRefresh: true,
  });
}
