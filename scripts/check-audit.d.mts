export interface Advisory {
  github_advisory_id: string
  module_name: string
  severity: string
}

export interface AuditException {
  id: string
  package: string
  reason: string
  granted: string
  expires: string
}

export function parseAdvisories(output: string): Advisory[]
export function validateExceptions(exceptions: unknown): string[]
export function evaluateAudit(input: {
  advisories: Advisory[]
  exceptions: unknown
  today: string
}): { failures: string[]; excepted: { advisory: Advisory; exception: AuditException }[] }
