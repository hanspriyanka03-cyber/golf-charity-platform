import { motion } from 'framer-motion'
import { Check, Zap, Crown } from 'lucide-react'
import type { Plan } from '../../types'
import Button from '../ui/Button'
import { formatCurrency } from '../../lib/utils'

interface SubscriptionCardProps {
  plan: Plan
  isPopular?: boolean
  onSelect?: (plan: Plan) => void
  isLoading?: boolean
  isActive?: boolean
  showToggle?: boolean
}

export default function SubscriptionCard({
  plan,
  isPopular,
  onSelect,
  isLoading,
  isActive,
  showToggle,
}: SubscriptionCardProps) {
  const isYearly = plan.plan_type === 'yearly'
  const monthlyEquivalent = isYearly ? plan.price / 12 : plan.price
  const savings = isYearly ? (9.99 * 12 - plan.price).toFixed(2) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      className={`relative glass-card p-6 transition-all duration-300 ${
        isPopular
          ? 'border-accent/40 shadow-glow-gold'
          : 'hover:border-border/80 hover:shadow-card-hover'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-accent to-yellow-400 rounded-full text-xs font-bold text-background">
            <Crown size={12} />
            Most Popular
          </div>
        </div>
      )}

      {isActive && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-success/15 border border-success/30 rounded-full text-xs font-medium text-success">
            <Zap size={10} />
            Current Plan
          </div>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPopular ? 'bg-accent/20' : 'bg-primary/20'}`}>
            {isYearly ? (
              <Crown size={16} className="text-accent" />
            ) : (
              <Zap size={16} className="text-primary-400" />
            )}
          </div>
          <span className="text-sm font-semibold text-text-primary capitalize">{plan.plan_type}</span>
        </div>

        <div className="flex items-end gap-1 mt-3">
          <span className="text-4xl font-black text-text-primary">
            {formatCurrency(monthlyEquivalent)}
          </span>
          <span className="text-text-muted text-sm mb-1.5">/month</span>
        </div>

        {isYearly && (
          <div className="mt-1 space-y-0.5">
            <p className="text-sm text-text-muted">
              Billed {formatCurrency(plan.price)} yearly
            </p>
            {savings && (
              <p className="text-sm font-medium text-success">
                Save {formatCurrency(parseFloat(savings))} per year
              </p>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <Check size={15} className="text-accent shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      {onSelect && (
        <Button
          variant={isPopular ? 'primary' : 'secondary'}
          onClick={() => onSelect(plan)}
          isLoading={isLoading}
          className="w-full"
        >
          {isActive ? 'Current Plan' : `Choose ${plan.plan_type}`}
        </Button>
      )}
    </motion.div>
  )
}
