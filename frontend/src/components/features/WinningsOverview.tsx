import { motion } from 'framer-motion'
import { Trophy, DollarSign, Clock, CheckCircle } from 'lucide-react'
import type { Winner } from '../../types'
import Badge from '../ui/Badge'
import { formatCurrency, getMatchLabel } from '../../lib/utils'

interface WinningsOverviewProps {
  winners: Winner[]
  compact?: boolean
}

export default function WinningsOverview({ winners, compact = false }: WinningsOverviewProps) {
  const totalWon = winners.reduce((sum, w) => sum + (w.prize_amount || 0), 0)
  const approvedWinnings = winners.filter(w => w.verification_status === 'approved')
  const paidWinnings = winners.filter(w => w.payment_status === 'paid')
  const pendingWinnings = winners.filter(w => w.verification_status === 'pending')

  if (winners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
          <Trophy size={24} className="text-text-muted" />
        </div>
        <p className="text-text-secondary font-medium">No winnings yet</p>
        <p className="text-sm text-text-muted mt-1">Enter your scores to participate in draws</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold gradient-text">{formatCurrency(totalWon)}</p>
            <p className="text-xs text-text-muted mt-0.5">Total Won</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-success">{paidWinnings.length}</p>
            <p className="text-xs text-text-muted mt-0.5">Paid Out</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-warning">{pendingWinnings.length}</p>
            <p className="text-xs text-text-muted mt-0.5">Pending</p>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {winners.slice(0, compact ? 3 : undefined).map((winner, idx) => (
          <motion.div
            key={winner.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
              winner.payment_status === 'paid'
                ? 'bg-success/5 border-success/20'
                : winner.verification_status === 'pending'
                ? 'bg-warning/5 border-warning/20'
                : 'bg-surface border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                winner.match_count === 5 ? 'bg-accent/20' : 'bg-primary/20'
              }`}>
                <Trophy size={16} className={winner.match_count === 5 ? 'text-accent' : 'text-primary-400'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{getMatchLabel(winner.match_count)}</p>
                {winner.draw_month && (
                  <p className="text-xs text-text-muted">{winner.draw_month}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-accent">{formatCurrency(winner.prize_amount || 0)}</p>
                <div className="flex items-center gap-1 justify-end">
                  <Badge variant="status" status={winner.payment_status} className="text-xs">
                    {winner.payment_status}
                  </Badge>
                </div>
              </div>
              {winner.verification_status === 'pending' && !winner.proof_url && (
                <div className="text-xs text-warning flex items-center gap-1">
                  <Clock size={12} />
                  Upload proof
                </div>
              )}
              {winner.payment_status === 'paid' && (
                <CheckCircle size={16} className="text-success" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
