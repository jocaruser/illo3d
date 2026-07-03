import fs from 'node:fs'
import path from 'node:path'

const JOBS_CSV = 'jobs.csv'
const PLACEHOLDER_PREFIX = '__DAYS_AGO_'
const PLACEHOLDER_SUFFIX = '__'

export function replaceDatePlaceholdersInFixture(fixtureDir: string): void {
  const jobsPath = path.join(fixtureDir, JOBS_CSV)
  if (!fs.existsSync(jobsPath)) return

  let content = fs.readFileSync(jobsPath, 'utf-8')
  const regex = new RegExp(
    PLACEHOLDER_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '(\\d+)' +
      PLACEHOLDER_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'g',
  )

  content = content.replace(regex, (_match, daysAgo: string) => {
    const n = parseInt(daysAgo, 10)
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString()
  })

  fs.writeFileSync(jobsPath, content, 'utf-8')
}
