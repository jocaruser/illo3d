import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  shadow?: 'sm' | 'DEFAULT' | 'lg' | 'xl' | '2xl' | 'none'
  interactive?: boolean
}

export function Card({ children, className = '', shadow = 'DEFAULT', interactive = false }: CardProps) {
  const shadowClass = {
    sm: 'shadow-sm',
    DEFAULT: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    none: '',
  }[shadow]

  const interactiveClass = interactive
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0'
    : ''

  return (
    <div className={`rounded-lg border border-border bg-surface-elevated ${shadowClass} ${interactiveClass} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-border px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`border-t border-border px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-text ${className}`}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-text-muted ${className}`}>
      {children}
    </p>
  )
}

interface EmptyCardProps {
  children: ReactNode
  className?: string
}

export function EmptyCard({ children, className = '' }: EmptyCardProps) {
  return (
    <Card className={`px-8 py-12 text-center ${className}`}>
      <p className="text-text-muted">{children}</p>
    </Card>
  )
}
