/**
 * Dependency vulnerability gate with time-boxed exceptions.
 *
 * Runs `pnpm audit --audit-level=high --json` and fails on any high or
 * critical advisory, except one that audit-exceptions.json names for that
 * package and whose window has not ended. pnpm's own `ignoreGhsas` has no
 * expiry, so it would silently exempt an advisory forever; an exception here
 * must carry `granted` and `expires` dates no more than one calendar month
 * apart, and it stops covering its advisory on the `expires` date.
 *
 * Fails closed: output that cannot be read as an audit report fails the gate.
 *
 * Usage: node scripts/check-audit.mjs
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BLOCKING_SEVERITIES = new Set(['high', 'critical'])
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The advisories of a `pnpm audit --json` report. */
export function parseAdvisories(output) {
  let report
  try {
    report = JSON.parse(output)
  } catch {
    throw new Error('pnpm audit output is not valid JSON')
  }
  if (
    report === null ||
    typeof report.advisories !== 'object' ||
    report.advisories === null
  ) {
    throw new Error('pnpm audit output has no advisories map')
  }
  return Object.values(report.advisories)
}

/** The last day an exception may end on: one calendar month after `granted`, clamped to month end. */
function latestExpiry(granted) {
  const [year, month, day] = granted.split('-').map(Number)
  const lastDayOfNextMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfNextMonth)))
    .toISOString()
    .slice(0, 10)
}

/** Problems that make the exception list untrustworthy; empty when it is sound. */
export function validateExceptions(exceptions) {
  if (!Array.isArray(exceptions))
    return ['audit-exceptions.json must hold an array of exceptions']
  const problems = []
  exceptions.forEach((exception, index) => {
    const label = `audit exception ${exception?.id ?? `#${index + 1}`}`
    const malformed = ['id', 'package', 'reason']
      .filter(
        (field) =>
          typeof exception?.[field] !== 'string' || exception[field] === ''
      )
      .concat(
        ['granted', 'expires'].filter(
          (field) => !ISO_DATE.test(exception?.[field] ?? '')
        )
      )
    if (malformed.length > 0) {
      problems.push(
        `${label} has a missing or malformed field: ${malformed.join(', ')} (dates are YYYY-MM-DD, expires is required)`
      )
    } else if (exception.expires <= exception.granted) {
      problems.push(`${label} must expire after it was granted`)
    } else if (exception.expires > latestExpiry(exception.granted)) {
      problems.push(
        `${label} runs longer than one month (granted ${exception.granted}, expires ${exception.expires})`
      )
    }
  })
  return problems
}

/**
 * Applies the exceptions to the advisories as of `today` (YYYY-MM-DD).
 * `failures` is what fails the gate; `excepted` is what it let through.
 */
export function evaluateAudit({ advisories, exceptions, today }) {
  const problems = validateExceptions(exceptions)
  if (problems.length > 0) return { failures: problems, excepted: [] }

  const failures = []
  const excepted = []
  for (const advisory of advisories.filter((candidate) =>
    BLOCKING_SEVERITIES.has(candidate.severity)
  )) {
    const exception = exceptions.find(
      (candidate) =>
        candidate.id === advisory.github_advisory_id &&
        candidate.package === advisory.module_name
    )
    const name = `${advisory.github_advisory_id} (${advisory.module_name}, ${advisory.severity})`
    if (!exception) {
      failures.push(`${name} has no exception`)
    } else if (today >= exception.expires) {
      failures.push(
        `${name} exception expired on ${exception.expires}; patch it or renew the entry`
      )
    } else {
      excepted.push({ advisory, exception })
    }
  }
  return { failures, excepted }
}

function main() {
  const audit = spawnSync('pnpm', ['audit', '--audit-level=high', '--json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (audit.error) throw audit.error
  const advisories = parseAdvisories(audit.stdout)
  const exceptions = JSON.parse(
    readFileSync(
      fileURLToPath(new URL('../audit-exceptions.json', import.meta.url)),
      'utf8'
    )
  )
  const { failures, excepted } = evaluateAudit({
    advisories,
    exceptions,
    today: new Date().toISOString().slice(0, 10),
  })

  for (const { advisory, exception } of excepted) {
    console.log(
      `excepted ${advisory.github_advisory_id} (${advisory.module_name}) until ${exception.expires}: ${exception.reason}`
    )
  }
  if (failures.length > 0) {
    console.error('check-audit: dependency audit failed')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }
  console.log(
    `check-audit: OK (no unexcepted high or critical advisories, ${excepted.length} excepted)`
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`check-audit: ${error.message}`)
    process.exit(2)
  }
}
