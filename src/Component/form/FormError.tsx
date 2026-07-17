interface FormErrorProps {
  message?: string
}

export function FormError({ message }: FormErrorProps) {
  if (message === undefined || message === '') return null
  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  )
}
