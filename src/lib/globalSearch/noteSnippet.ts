const DEFAULT_MAX = 100

export function bodyContainsQuery(body: string, query: string): boolean {
  const q = normalize(query)
  if (q.length < 2) {
    return false
  }
  return normalize(body).includes(q)
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function extractNoteSnippet(
  body: string,
  query: string,
  maxLen = DEFAULT_MAX
): string {
  const n = body.replace(/\s+/g, ' ').trim()
  const q = query.trim()
  if (!n || q.length < 2) {
    return n.slice(0, maxLen)
  }
  const lower = n.toLowerCase()
  const qi = lower.indexOf(q.toLowerCase())
  if (qi === -1) {
    return n.slice(0, maxLen)
  }
  const half = Math.floor(maxLen / 2)
  const start = Math.max(0, qi - half)
  let slice = n.slice(start, start + maxLen)
  if (start > 0) {
    slice = `…${slice}`
  }
  if (start + maxLen < n.length) {
    slice = `${slice}…`
  }
  return slice
}
