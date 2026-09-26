import { describe, expect, it } from "vitest";
import {
  buildIssueGraphLivenessIncidentKey,
  RECOVERY_ORIGIN_KINDS,
  resolveIssueBackedRecoverySourceIssueId,
} from "./origins.js";

describe("resolveIssueBackedRecoverySourceIssueId", () => {
  const companyId = "company-1";
  const sourceIssueId = "source-1";

  it("resolves stranded_issue_recovery originId as the source issue", () => {
    expect(
      resolveIssueBackedRecoverySourceIssueId({
        companyId,
        originKind: RECOVERY_ORIGIN_KINDS.strandedIssueRecovery,
        originId: sourceIssueId,
      }),
    ).toBe(sourceIssueId);
  });

  it("resolves harness_liveness_escalation incident keys to the source issue", () => {
    const originId = buildIssueGraphLivenessIncidentKey({
      companyId,
      issueId: sourceIssueId,
      state: "blocked_by_unassigned_issue",
      blockerIssueId: "blocker-1",
    });

    expect(
      resolveIssueBackedRecoverySourceIssueId({
        companyId,
        originKind: RECOVERY_ORIGIN_KINDS.issueGraphLivenessEscalation,
        originId,
      }),
    ).toBe(sourceIssueId);
  });

  it("rejects harness_liveness_escalation keys from another company", () => {
    const originId = buildIssueGraphLivenessIncidentKey({
      companyId: "other-company",
      issueId: sourceIssueId,
      state: "blocked_by_unassigned_issue",
    });

    expect(
      resolveIssueBackedRecoverySourceIssueId({
        companyId,
        originKind: RECOVERY_ORIGIN_KINDS.issueGraphLivenessEscalation,
        originId,
      }),
    ).toBeNull();
  });

  it("returns null for non issue-backed recovery origins", () => {
    expect(
      resolveIssueBackedRecoverySourceIssueId({
        companyId,
        originKind: RECOVERY_ORIGIN_KINDS.issueProductivityReview,
        originId: sourceIssueId,
      }),
    ).toBeNull();
  });
});
