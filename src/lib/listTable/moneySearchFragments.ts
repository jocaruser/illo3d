/**
 * Text fragments for fuzzy search over money fields (design matrix D1–D3).
 */
export function moneySearchFragments(
  value: number | undefined | null
): string[] {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return []
  }
  const n = Number(value)
  const out = new Set<string>()
  out.add(String(n))
  out.add(n.toFixed(2))
  out.add(n.toFixed(2).replace('.', ','))
  if (Number.isInteger(n)) {
    out.add(`${n}.00`)
    out.add(`${n},00`)
  }
  return [...out]
}

export function joinSearchParts(parts: Iterable<string | undefined | null>): string {
  const chunks: string[] = []
  for (const p of parts) {
    if (p === undefined || p === null) continue
    const s = String(p).trim()
    if (s.length > 0) {
      chunks.push(s)
    }
  }
  return chunks.join(' \n ')
}
