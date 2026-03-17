import type { CompactResult, ContextEngineRuntimeContext } from "./types.js";

/**
 * Parameters accepted by {@link delegateCompactionToRuntime}.
 * Matches the `compact()` signature from the `ContextEngine` interface.
 */
export type DelegateCompactionParams = {
  sessionId: string;
  sessionKey?: string;
  sessionFile: string;
  tokenBudget?: number;
  force?: boolean;
  currentTokenCount?: number;
  compactionTarget?: "budget" | "threshold";
  customInstructions?: string;
  runtimeContext?: ContextEngineRuntimeContext;
};

/**
 * Delegate compaction to the built-in OpenClaw compaction runtime.
 *
 * Context engine plugins that set `ownsCompaction: false` should call this
 * from their `compact()` method so that manual `/compact` and overflow
 * recovery continue to work when the plugin is the active engine.
 *
 * This encapsulates the same bridging logic that `LegacyContextEngine`
 * uses internally — spreading `runtimeContext`, resolving fallbacks, and
 * mapping the result into a `CompactResult`.
 */
export async function delegateCompactionToRuntime(
  params: DelegateCompactionParams,
): Promise<CompactResult> {
  const { compactEmbeddedPiSessionDirect } =
    await import("../agents/pi-embedded-runner/compact.runtime.js");

  // runtimeContext carries the full CompactEmbeddedPiSessionParams fields
  // set by the caller in run.ts.  We spread them and override the fields
  // that come from the ContextEngine compact() signature directly.
  const runtimeContext = params.runtimeContext ?? {};
  const currentTokenCount =
    params.currentTokenCount ??
    (typeof runtimeContext.currentTokenCount === "number" &&
    Number.isFinite(runtimeContext.currentTokenCount) &&
    runtimeContext.currentTokenCount > 0
      ? Math.floor(runtimeContext.currentTokenCount)
      : undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridge runtimeContext matches CompactEmbeddedPiSessionParams
  const result = await compactEmbeddedPiSessionDirect({
    ...runtimeContext,
    sessionId: params.sessionId,
    sessionFile: params.sessionFile,
    tokenBudget: params.tokenBudget,
    ...(currentTokenCount !== undefined ? { currentTokenCount } : {}),
    force: params.force,
    customInstructions: params.customInstructions,
    workspaceDir: (runtimeContext.workspaceDir as string) ?? process.cwd(),
  } as Parameters<typeof compactEmbeddedPiSessionDirect>[0]);

  return {
    ok: result.ok,
    compacted: result.compacted,
    reason: result.reason,
    result: result.result
      ? {
          summary: result.result.summary,
          firstKeptEntryId: result.result.firstKeptEntryId,
          tokensBefore: result.result.tokensBefore,
          tokensAfter: result.result.tokensAfter,
          details: result.result.details,
        }
      : undefined,
  };
}
