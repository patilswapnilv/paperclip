export const RECOVERY_ORIGIN_KINDS = {
  issueGraphLivenessEscalation: "harness_liveness_escalation",
  // Historical tasks retain their origin and recovery-recursion exclusion.
  issueProductivityReview: "issue_productivity_review",
  strandedIssueRecovery: "stranded_issue_recovery",
  staleActiveRunEvaluation: "stale_active_run_evaluation",
} as const;

export const RECOVERY_REASON_KINDS = {
  runLivenessContinuation: "run_liveness_continuation",
} as const;

export const RECOVERY_KEY_PREFIXES = {
  issueGraphLivenessIncident: "harness_liveness",
  issueGraphLivenessLeaf: "harness_liveness_leaf",
} as const;

export type RecoveryOriginKind = typeof RECOVERY_ORIGIN_KINDS[keyof typeof RECOVERY_ORIGIN_KINDS];
export type RecoveryReasonKind = typeof RECOVERY_REASON_KINDS[keyof typeof RECOVERY_REASON_KINDS];
export type RecoveryKeyPrefix = typeof RECOVERY_KEY_PREFIXES[keyof typeof RECOVERY_KEY_PREFIXES];

export function isStrandedIssueRecoveryOriginKind(originKind: string | null | undefined) {
  return originKind === RECOVERY_ORIGIN_KINDS.strandedIssueRecovery;
}

export function buildIssueGraphLivenessIncidentKey(input: {
  companyId: string;
  issueId: string;
  state: string;
  blockerIssueId?: string | null;
  participantAgentId?: string | null;
}) {
  return [
    RECOVERY_KEY_PREFIXES.issueGraphLivenessIncident,
    input.companyId,
    input.issueId,
    input.state,
    input.blockerIssueId ?? input.participantAgentId ?? "none",
  ].join(":");
}

export function parseIssueGraphLivenessIncidentKey(incidentKey: string | null | undefined) {
  if (!incidentKey) return null;
  const parts = incidentKey.split(":");
  if (parts.length !== 5 || parts[0] !== RECOVERY_KEY_PREFIXES.issueGraphLivenessIncident) return null;
  const [, companyId, issueId, state, leafIssueId] = parts;
  if (!companyId || !issueId || !state || !leafIssueId) return null;
  return { companyId, issueId, state, leafIssueId };
}

/**
 * Issue-backed recovery work may temporarily block its source issue.
 * When that recovery issue becomes terminal (`done` / `cancelled`), the
 * control plane must clear that blocks edge so the source cannot deadlock
 * on a finished or abandoned recovery task.
 *
 * Returns the source issue id when `originKind`/`originId` identify an
 * issue-backed recovery that may hold such an edge; otherwise null.
 */
export function resolveIssueBackedRecoverySourceIssueId(input: {
  companyId: string;
  originKind: string | null | undefined;
  originId: string | null | undefined;
}): string | null {
  if (!input.originKind || !input.originId) return null;

  if (input.originKind === RECOVERY_ORIGIN_KINDS.strandedIssueRecovery) {
    return input.originId;
  }

  if (input.originKind === RECOVERY_ORIGIN_KINDS.issueGraphLivenessEscalation) {
    const parsed = parseIssueGraphLivenessIncidentKey(input.originId);
    if (parsed?.issueId && parsed.companyId === input.companyId) {
      return parsed.issueId;
    }
  }

  return null;
}

export function buildIssueGraphLivenessLeafKey(input: {
  companyId: string;
  state: string;
  leafIssueId: string;
}) {
  return [
    RECOVERY_KEY_PREFIXES.issueGraphLivenessLeaf,
    input.companyId,
    input.state,
    input.leafIssueId,
  ].join(":");
}
