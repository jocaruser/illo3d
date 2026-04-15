function capitalizeWord(word: string): string {
  if (!word) return ''
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/** Each whitespace-separated word: first character upper, all others lower. */
export function formatTagNameTitleCase(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+/).map(capitalizeWord).join(' ')
}
