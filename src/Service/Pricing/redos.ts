export type RedoBand = 'safe' | 'tight' | 'risky'

export interface RedoResult {
  redos: number
  band: RedoBand
}

export function redoBand(redos: number): RedoBand {
  if (redos >= 2) return 'safe'
  if (redos === 1) return 'tight'
  return 'risky'
}

/** How many times the remaining stock covers a re-print of `need`. */
export function computeRedos(qtyCurrent: number, need: number): RedoResult {
  const effectiveNeed = need > 0 ? need : 1
  const redos = Math.max(0, Math.floor((qtyCurrent - effectiveNeed) / effectiveNeed))
  return { redos, band: redoBand(redos) }
}
