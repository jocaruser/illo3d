interface ColourSwatchProps {
  colour: string
}

/** Small rounded swatch for v3 inventory colours. Renders nothing for ''. */
export function ColourSwatch({ colour }: ColourSwatchProps) {
  if (colour === '') return null
  return (
    <span
      aria-hidden="true"
      title={colour}
      className="inline-block h-4 w-4 shrink-0 rounded-full border border-border"
      style={{ backgroundColor: colour }}
    />
  )
}
