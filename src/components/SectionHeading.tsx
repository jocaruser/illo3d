interface SectionHeadingProps {
  title: string
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
      {title}
    </h3>
  )
}
