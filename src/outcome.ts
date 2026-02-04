import type { OperationOutcome, OperationOutcomeIssue } from "./fhir";

export type StatusPayload = {
  status: "success" | "error";
  outcome?: OperationOutcome;
};

export function buildOutcome(
  severity: OperationOutcomeIssue["severity"],
  code: OperationOutcomeIssue["code"],
  diagnostics: string,
): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity,
        code,
        diagnostics,
      },
    ],
  };
}
