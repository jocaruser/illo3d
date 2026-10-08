import { describe, expect, it } from 'vitest'
import {
  evaluateAudit,
  parseAdvisories,
  validateExceptions,
} from '../../../scripts/check-audit.mjs'

const braces = {
  github_advisory_id: 'GHSA-vfj7-8cjw-p6xm',
  module_name: 'braces',
  severity: 'high',
}
const other = {
  github_advisory_id: 'GHSA-68fv-2mgg-jv7q',
  module_name: 'source-map-js',
  severity: 'high',
}
const moderate = {
  github_advisory_id: 'GHSA-82fw-gwwq-j7x9',
  module_name: 'vitest',
  severity: 'moderate',
}
const exception = {
  id: 'GHSA-vfj7-8cjw-p6xm',
  package: 'braces',
  reason: 'no patched release exists',
  granted: '2026-10-07',
  expires: '2026-11-07',
}

describe('parseAdvisories', () => {
  it('returns the advisories of a pnpm audit report', () => {
    const report = JSON.stringify({ advisories: { 1: braces, 2: moderate } })
    expect(parseAdvisories(report)).toEqual([braces, moderate])
  })

  it('fails closed on output that is not JSON', () => {
    expect(() => parseAdvisories('ERR_PNPM_AUDIT_BAD_RESPONSE')).toThrow(
      /not valid JSON/
    )
  })

  it('fails closed on JSON without an advisories map', () => {
    expect(() => parseAdvisories('{"error":{"code":"ERR"}}')).toThrow(
      /advisories/
    )
  })
})

describe('validateExceptions', () => {
  it('accepts a well-formed exception inside its window', () => {
    expect(validateExceptions([exception])).toEqual([])
  })

  it('rejects an exception with no expiry', () => {
    const { expires: _expires, ...open } = exception
    expect(validateExceptions([open])).toEqual([
      expect.stringMatching(/GHSA-vfj7-8cjw-p6xm.*expires/),
    ])
  })

  it('rejects an exception with a missing or malformed field', () => {
    expect(
      validateExceptions([{ ...exception, granted: 'yesterday', reason: '' }])
    ).toEqual([expect.stringMatching(/malformed field: reason, granted/)])
  })

  it('rejects a window longer than one month', () => {
    expect(
      validateExceptions([{ ...exception, expires: '2026-11-08' }])
    ).toEqual([expect.stringMatching(/longer than one month/)])
  })

  it('accepts a window ending exactly one month after the grant, including month-end clamping', () => {
    expect(
      validateExceptions([
        { ...exception, granted: '2026-01-31', expires: '2026-02-28' },
      ])
    ).toEqual([])
  })

  it('rejects an expiry that is not after the grant', () => {
    expect(
      validateExceptions([{ ...exception, expires: '2026-10-07' }])
    ).toEqual([expect.stringMatching(/after it was granted/)])
  })

  it('rejects a list that is not an array', () => {
    expect(validateExceptions({})).toEqual([expect.stringMatching(/array/)])
  })
})

describe('evaluateAudit', () => {
  it('passes an advisory covered by an unexpired exception and reports it with its expiry', () => {
    const result = evaluateAudit({
      advisories: [braces],
      exceptions: [exception],
      today: '2026-10-08',
    })
    expect(result.failures).toEqual([])
    expect(result.excepted).toEqual([{ advisory: braces, exception }])
  })

  it('fails once the exception has expired', () => {
    const result = evaluateAudit({
      advisories: [braces],
      exceptions: [exception],
      today: '2026-11-07',
    })
    expect(result.failures).toEqual([
      expect.stringMatching(/GHSA-vfj7-8cjw-p6xm.*braces/),
    ])
    expect(result.failures.join('\n')).toMatch(/expired on 2026-11-07/)
    expect(result.excepted).toEqual([])
  })

  it('still passes on the last day before expiry', () => {
    expect(
      evaluateAudit({
        advisories: [braces],
        exceptions: [exception],
        today: '2026-11-06',
      }).failures
    ).toEqual([])
  })

  it('fails an unlisted high advisory while the exception covers only its own', () => {
    const result = evaluateAudit({
      advisories: [braces, other],
      exceptions: [exception],
      today: '2026-10-08',
    })
    expect(result.failures).toEqual([
      expect.stringMatching(/GHSA-68fv-2mgg-jv7q.*source-map-js/),
    ])
  })

  it('does not let an exception for one package cover the same advisory id in another', () => {
    const result = evaluateAudit({
      advisories: [{ ...braces, module_name: 'micromatch' }],
      exceptions: [exception],
      today: '2026-10-08',
    })
    expect(result.failures).toHaveLength(1)
  })

  it('ignores advisories below the high level', () => {
    expect(
      evaluateAudit({
        advisories: [moderate],
        exceptions: [],
        today: '2026-10-08',
      }).failures
    ).toEqual([])
  })

  it('treats a critical advisory as a failure', () => {
    const critical = { ...other, severity: 'critical' }
    expect(
      evaluateAudit({
        advisories: [critical],
        exceptions: [],
        today: '2026-10-08',
      }).failures
    ).toHaveLength(1)
  })

  it('fails when an exception is invalid, even if it would cover an advisory', () => {
    const open = { ...exception, expires: '2027-01-01' }
    const result = evaluateAudit({
      advisories: [braces],
      exceptions: [open],
      today: '2026-10-08',
    })
    expect(result.failures.join('\n')).toMatch(/longer than one month/)
    expect(result.excepted).toEqual([])
  })
})
