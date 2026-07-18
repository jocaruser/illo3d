import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme, type MarkdownRenderer } from 'vitepress'

const REPO = 'jocaruser/illo3d'
const APP_URL = 'https://jocaruser.github.io/illo3d/'

// Every knob is an env var so scripts/build-wiki.sh can rebuild the same site
// for the working tree ("latest") and for each release-tag snapshot.
const wikiDir = dirname(fileURLToPath(import.meta.url))
const specsDir = resolve(process.env.SPECS_DIR ?? join(wikiDir, '..', '..', 'specs'))
const gitRef = process.env.WIKI_GIT_REF ?? 'main'
const versionLabel = process.env.WIKI_VERSION_LABEL ?? 'latest'
const versionMenu = parseVersionMenu(process.env.WIKI_VERSIONS)

// specs/changes/ holds local-only drafts (gitignored) and must never publish.
const unpublishedDirs = new Set(['changes'])

export default defineConfig({
  title: 'illo3d specs',
  description: 'Behaviour specs for illo3d — the canonical record of what the app does.',
  srcDir: specsDir,
  base: process.env.WIKI_BASE ?? '/',
  outDir: process.env.WIKI_OUT_DIR ?? './.vitepress/dist',
  cacheDir: process.env.WIKI_CACHE_DIR ?? './.vitepress/cache',
  // Specs forward-reference pages that are planned but not yet written
  // (see the checklist in specs/README.md), so dead links must not fail the build.
  ignoreDeadLinks: true,
  // Snapshot sources live outside the repository, where git has no history.
  lastUpdated: versionLabel === 'latest',
  rewrites: {
    'README.md': 'index.md',
    ':dir/README.md': ':dir/index.md',
    ':dir/:sub/README.md': ':dir/:sub/index.md',
  },
  markdown: { config: linkOutOfTreeToGitHub },
  themeConfig: {
    siteTitle: versionLabel === 'latest' ? 'illo3d specs' : `illo3d specs · ${versionLabel}`,
    nav: buildNav(),
    sidebar: buildSidebar(),
    search: { provider: 'local' },
    editLink: {
      pattern: `https://github.com/${REPO}/edit/main/specs/:path`,
      text: 'Edit this page on GitHub',
    },
    socialLinks: [{ icon: 'github', link: `https://github.com/${REPO}` }],
    outline: [2, 3],
  },
})

function parseVersionMenu(raw: string | undefined): DefaultTheme.NavItemWithLink[] {
  if (!raw) return []
  return JSON.parse(raw) as DefaultTheme.NavItemWithLink[]
}

function buildNav(): DefaultTheme.NavItem[] {
  const nav: DefaultTheme.NavItem[] = []
  if (versionMenu.length > 0) nav.push({ text: versionLabel, items: versionMenu })
  nav.push({ text: 'App', link: APP_URL })
  return nav
}

function buildSidebar(): DefaultTheme.SidebarItem[] {
  return [{ text: 'Overview', link: '/' }, ...sectionItems(specsDir, '')]
}

function sectionItems(dir: string, prefix: string): DefaultTheme.SidebarItem[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const pages = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
    .map((entry) => ({
      text: pageTitle(join(dir, entry.name), entry.name),
      link: `/${prefix}${entry.name.replace(/\.md$/, '')}`,
    }))
    .sort(byText)
  const groups = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !unpublishedDirs.has(entry.name))
    .map((entry) => sectionGroup(join(dir, entry.name), `${prefix}${entry.name}/`, entry.name))
    .sort(byText)
  return [...pages, ...groups]
}

function sectionGroup(dir: string, prefix: string, name: string): DefaultTheme.SidebarItem {
  const readme = join(dir, 'README.md')
  const hasIndex = existsSync(readme)
  return {
    text: hasIndex ? pageTitle(readme, name) : capitalise(name),
    ...(hasIndex ? { link: `/${prefix}` } : {}),
    collapsed: false,
    items: sectionItems(dir, prefix),
  }
}

function pageTitle(filePath: string, fallback: string): string {
  const heading = /^#\s+(.+)$/m.exec(readFileSync(filePath, 'utf8'))
  if (!heading) return fallback
  return heading[1].replace(/`/g, '').trim()
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function byText(a: { text: string }, b: { text: string }): number {
  return a.text.localeCompare(b.text)
}

// Relative links that leave specs/ (e.g. ../../schema.dbml) cannot resolve on
// the published site, so they open the referenced file on GitHub instead,
// pinned to the ref this build renders.
function linkOutOfTreeToGitHub(md: MarkdownRenderer): void {
  md.core.ruler.push('illo3d-out-of-tree-links', (state) => {
    const page = state.env?.relativePath as string | undefined
    if (!page) return
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue
      for (const child of token.children) {
        if (child.type !== 'link_open') continue
        const href = child.attrGet('href')
        if (!href || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) continue
        const hashIndex = href.indexOf('#')
        const filePart = hashIndex === -1 ? href : href.slice(0, hashIndex)
        const hash = hashIndex === -1 ? '' : href.slice(hashIndex)
        const fromRepoRoot = posix.normalize(posix.join('specs', posix.dirname(page), filePart))
        if (fromRepoRoot.startsWith('specs/') || fromRepoRoot.startsWith('..')) continue
        child.attrSet('href', `https://github.com/${REPO}/blob/${gitRef}/${fromRepoRoot}${hash}`)
      }
    }
  })
}
