import { motion } from 'framer-motion'
import { Trophy, Calendar, Users, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Draw, UserDrawResult } from '../../types'
import Badge from '../ui/Badge'
import { formatCurrency, formatDate } from '../../lib/utils'

interface DrawCardProps {
  draw: Draw
  userResult?: UserDrawResult
  showDetails?: boolean
}

export default function DrawCard({ draw, userResult, showDetails = false }: DrawCardProps) {
  const hasWon = userResult?.is_winner
  const matchedCount = userResult?.numbers_matched ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 transition-all duration-300 hover:shadow-card-hover ${hasWon ? 'border-accent/30' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-text-muted" />
            <span className="text-sm text-text-muted">{draw.month}</span>
          </div>
          <h3 className="font-semibold text-text-primary">Monthly Draw</h3>
        </div>
        <Badge variant="status" status={draw.status}>{draw.status}</Badge>
      </div>

      {/* Drawn Numbers */}
      {draw.drawn_numbers && draw.drawn_numbers.length > 0 ? (
        <div className="mb-4">
          <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Drawn Numbers</p>
          <div className="flex gap-2 flex-wrap">
            {draw.drawn_numbers.map((num, idx) => {
              const isMatched = userResult?.user_scores.includes(num)
              return (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: idx * 0.1, type: 'spring' }}
                  className={`number-ball w-10 h-10 text-sm ${isMatched ? 'ring-2 ring-white shadow-glow-gold' : ''}`}
                >
                  {num}
                </motion.div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-10 h-10 rounded-full bg-surface border-2 border-dashed border-border animate-pulse" />
          ))}
        </div>
      )}

      {/* User result */}
      {userResult && (
        <div className={`rounded-xl p-3 mb-4 ${hasWon ? 'bg-accent/10 border border-accent/20' : 'bg-surface border border-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Your matches</span>
            <div className="flex items-center gap-1.5">
              {hasWon ? (
                <Trophy size={14} className="text-accent" />
              ) : null}
              <span className={`font-bold text-sm ${matchedCount >= 3 ? 'text-accent' : 'text-text-muted'}`}>
                {matchedCount} / 5
              </span>
            </div>
          </div>
          {hasWon && userResult.win_details && (
            <p className="text-xs text-accent mt-1">
              Won: {formatCurrency(userResult.win_details.prize_amount || 0)} — {userResult.win_details.verification_status}
            </p>
          )}
        </div>
      )}

      {/* Prize pool info */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center bg-surface rounded-lg p-2">
          <p className="text-xs text-text-muted">5 Match</p>
          <p className="text-sm font-semibold text-accent">{formatCurrency(draw.five_match_pool)}</p>
        </div>
        <div className="text-center bg-surface rounded-lg p-2">
          <p className="text-xs text-text-muted">4 Match</p>
          <p className="text-sm font-semibold text-primary-400">{formatCurrency(draw.four_match_pool)}</p>
        </div>
        <div className="text-center bg-surface rounded-lg p-2">
          <p className="text-xs text-text-muted">3 Match</p>
          <p className="text-sm font-semibold text-primary-400">{formatCurrency(draw.three_match_pool)}</p>
        </div>
      </div>

      {showDetails && (
        <Link
          to={`/draws/${draw.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-border text-sm text-text-secondary hover:text-accent hover:border-accent/50 transition-all"
        >
          <TrendingUp size={14} />
          View Full Results
        </Link>
      )}
    </motion.div>
  )
}
