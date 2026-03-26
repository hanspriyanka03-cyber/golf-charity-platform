import { type ReactNode } from 'react'
import { cn, getStatusColor } from '../../lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'status' | 'default' | 'gold' | 'green'
  status?: string
  className?: string
}

export default function Badge({ children, variant = 'default', status, className }: BadgeProps) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border'

  if (variant === 'status' && status) {
    return (
      <span className={cn(base, getStatusColor(status), className)}>
        {children}
      </span>
    )
  }

  const variants = {
    default: 'bg-surface border-border text-text-secondary',
    gold: 'bg-accent/10 border-accent/30 text-accent',
    green: 'bg-primary/10 border-primary/30 text-primary-300',
  }

  const variantKey = variant === 'status' ? 'default' : variant
  return (
    <span className={cn(base, variants[variantKey as keyof typeof variants], className)}>
      {children}
    </span>
  )
}
