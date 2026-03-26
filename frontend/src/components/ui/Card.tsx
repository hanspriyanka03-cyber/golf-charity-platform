import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({ children, variant = 'default', padding = 'md', className, ...props }: CardProps) {
  const base = 'rounded-2xl border transition-all duration-300'

  const variants = {
    default: 'bg-surface border-border',
    glass: 'border-border/50 backdrop-blur-md bg-surface/80',
    gradient: 'bg-gradient-to-br from-surface to-surface-2 border-border',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(base, variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-text-primary', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  )
}
