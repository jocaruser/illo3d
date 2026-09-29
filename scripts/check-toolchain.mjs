/**
 * Toolchain drift gate.
 *
 * Every install, build and test — CI, e2e and the Pages deploy — runs inside the
 * Docker images, so their Node and pnpm are the only ones that matter. This
 * check keeps it that way:
 *
 * - `packageManager` in package.json pins pnpm to an exact version, and every
 *   Dockerfile that installs pnpm must install exactly that version.
 * - No workflow or action may set up Node or pnpm on the runner or call npm/npx/pnpm
 *   directly. A runner-side toolchain is not exercised by the PR gates, so it
 *   can break on release without warning (a floating `npm install -g pnpm` in
 *   deploy.yml picked up a pnpm major that rejected our lockfile).
 *
 * Usage: node scripts/check-toolchain.mjs
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const failures = []

const { packageManager } = JSON.parse(readFileSync('package.json', 'utf8'))
const pinned = /^pnpm@(\d+\.\d+\.\d+)$/.exec(packageManager ?? '')?.[1]
if (!pinned) {
  failures.push(`package.json packageManager must be an exact "pnpm@x.y.z", got ${JSON.stringify(packageManager)}`)
}

for (const dockerfile of readdirSync('.').filter((name) => name.startsWith('Dockerfile'))) {
  // Join continuation lines so a multi-line RUN is checked as one command.
  const source = readFileSync(dockerfile, 'utf8').replace(/\\\n/g, ' ')
  // Any pinned pnpm (npm install, corepack prepare, …) must be the pinned one.
  for (const [, version] of source.matchAll(/\bpnpm@(\S+)/g)) {
    if (version !== pinned) failures.push(`${dockerfile} installs pnpm@${version}, package.json pins ${pinned}`)
  }
  // An unversioned install floats to whatever pnpm is newest.
  if (/\bnpm (install|i)\b[^\n]*\bpnpm(?!@)\b/.test(source)) {
    failures.push(`${dockerfile} installs pnpm without a version, package.json pins ${pinned}`)
  }
}

const ciFiles = readdirSync('.github', { recursive: true })
  .filter((name) => /\.ya?ml$/.test(name))
  .map((name) => join('.github', name))
for (const path of ciFiles) {
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (/^\s*#/.test(line)) return
      if (/uses:\s*(actions\/setup-node|pnpm\/action-setup)@/.test(line)) {
        failures.push(`${path}:${index + 1} sets up a runner-side toolchain; build through the app image instead`)
      } else if (/\b(npm|pnpm)\s+(install|i|ci|add|run|exec|dlx|build)\b|\bnpx\s/.test(line) && !/docker compose/.test(line)) {
        failures.push(`${path}:${index + 1} runs npm/pnpm on the runner; use a make target instead`)
      }
    })
}

if (failures.length > 0) {
  console.error('check-toolchain: toolchain drift detected')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(`check-toolchain: OK (pnpm ${pinned}, no runner-side Node/pnpm in .github)`)
