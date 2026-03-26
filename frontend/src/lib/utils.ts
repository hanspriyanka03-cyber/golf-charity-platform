import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function getMatchLabel(matchCount: number): string {
  switch (matchCount) {
    case 5: return '5-Number Match'
    case 4: return '4-Number Match'
    case 3: return '3-Number Match'
    default: return `${matchCount}-Number Match`
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active': return 'text-success bg-success/10 border-success/20'
    case 'pending': return 'text-warning bg-warning/10 border-warning/20'
    case 'approved': return 'text-success bg-success/10 border-success/20'
    case 'rejected': return 'text-error bg-error/10 border-error/20'
    case 'paid': return 'text-accent bg-accent/10 border-accent/20'
    case 'cancelled': return 'text-text-muted bg-surface border-border'
    case 'lapsed': return 'text-error bg-error/10 border-error/20'
    case 'published': return 'text-success bg-success/10 border-success/20'
    case 'draft': return 'text-text-secondary bg-surface border-border'
    case 'simulated': return 'text-accent bg-accent/10 border-accent/20'
    default: return 'text-text-secondary bg-surface border-border'
  }
}

export function scoreToColor(score: number): string {
  if (score >= 36) return 'from-accent to-yellow-500'
  if (score >= 28) return 'from-primary-600 to-primary-400'
  if (score >= 20) return 'from-primary-700 to-primary-500'
  return 'from-primary-800 to-primary-600'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
