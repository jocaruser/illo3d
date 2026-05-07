interface SectionHeadingProps {
  title: string
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <h3 className="mb-3 text-lg font-semibold text-text">
      {title}
    </h3>
  )
}
