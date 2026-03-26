import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Trophy, Target, Heart, Clock, TrendingUp, ArrowRight, Zap, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useScores } from '../../hooks/useScores'
import { winnersApi, drawsApi, charitiesApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import WinningsOverview from '../../components/features/WinningsOverview'
import Badge from '../../components/ui/Badge'
import { formatCurrency, formatDate, scoreToColor } from '../../lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { scores, isLoading: scoresLoading } = useScores()

  const { data: winnings } = useQuery({
    queryKey: ['my-winnings'],
    queryFn: () => winnersApi.myWinnings().then(r => r.data),
  })

  const { data: draws } = useQuery({
    queryKey: ['draws'],
    queryFn: () => drawsApi.listDraws().then(r => r.data),
  })

  const { data: charity } = useQuery({
    queryKey: ['charity', user?.charity_id],
    queryFn: () => charitiesApi.getCharity(user!.charity_id!).then(r => r.data),
    enabled: !!user?.charity_id,
  })

  const latestDraw = draws?.[0]
  const pendingWins = winnings?.filter(w => w.verification_status === 'pending') || []
  const totalWon = winnings?.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0

  // Countdown to next draw (first day of next month)
  const now = new Date()
  const nextDraw = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const daysToNextDraw = Math.ceil((nextDraw.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'Golfer'}</span> 👋
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">Here's your GolfGive summary</p>
        </div>

        {/* Subscription banner */}
        {user?.subscription_status !== 'active' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-warning shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">No active subscription</p>
                <p className="text-xs text-text-secondary">Subscribe to participate in monthly draws</p>
              </div>
            </div>
            <Link to="/dashboard/settings" className="btn-primary text-xs px-3 py-1.5 shrink-0">
              Subscribe Now
            </Link>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Subscription',
              value: <Badge variant="status" status={user?.subscription_status || 'inactive'}>{user?.subscription_status || 'Inactive'}</Badge>,
              icon: <Zap size={20} className="text-accent" />,
              bg: 'bg-accent/5 border-accent/15',
            },
            {
              label: 'My Scores',
              value: <span className="text-2xl font-bold text-text-primary">{scores.length}/5</span>,
              icon: <Target size={20} className="text-primary-400" />,
              bg: 'bg-primary/5 border-primary/15',
            },
            {
              label: 'Total Winnings',
              value: <span className="text-2xl font-bold text-accent">{formatCurrency(totalWon)}</span>,
              icon: <Trophy size={20} className="text-accent" />,
              bg: 'bg-accent/5 border-accent/15',
            },
            {
              label: 'Next Draw',
              value: <span className="text-2xl font-bold text-text-primary">{daysToNextDraw}d</span>,
              icon: <Clock size={20} className="text-primary-400" />,
              bg: 'bg-primary/5 border-primary/15',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className={`glass-card p-4 border ${stat.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</span>
                {stat.icon}
              </div>
              {stat.value}
            </motion.div>
          ))}
        </div>

        {/* Scores + Charity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current scores */}
          <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Target size={16} className="text-accent" />
                My Scores
              </h2>
              <Link to="/dashboard/scores" className="text-xs text-accent hover:underline flex items-center gap-1">
                Manage <ArrowRight size={12} />
              </Link>
            </div>

            {scoresLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin w-6 h-6 border-2 border-border border-t-accent rounded-full" />
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center py-6">
                <Target size={28} className="text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No scores yet</p>
                <Link to="/dashboard/scores" className="text-xs text-accent mt-1 hover:underline">Add your first score</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {scores.map((score, idx) => (
                  <div key={score.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scoreToColor(score.score)} flex items-center justify-center text-lg font-bold text-white`}>
                        {score.score}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">Score {score.score}</p>
                        <p className="text-xs text-text-muted">{formatDate(score.date_played)}</p>
                      </div>
                    </div>
                    {idx === 0 && (
                      <Badge variant="gold" className="text-xs">Latest</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Charity */}
          <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Heart size={16} className="text-error" />
                My Charity
              </h2>
              <Link to="/dashboard/charity" className="text-xs text-accent hover:underline flex items-center gap-1">
                Change <ArrowRight size={12} />
              </Link>
            </div>

            {charity ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {charity.image_url && (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="w-12 h-12 rounded-xl object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-text-primary">{charity.name}</p>
                    <p className="text-xs text-text-muted line-clamp-1">{charity.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl">
                  <span className="text-sm text-text-secondary">Your contribution</span>
                  <Badge variant="gold">{user?.charity_percentage || 10}%</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Heart size={28} className="text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No charity selected</p>
                <Link to="/dashboard/charity" className="text-xs text-accent mt-1 hover:underline">Choose a charity</Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Winnings */}
        {winnings && winnings.length > 0 && (
          <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Trophy size={16} className="text-accent" />
                Recent Winnings
              </h2>
              <Link to="/dashboard/draws" className="text-xs text-accent hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <WinningsOverview winners={winnings} compact />
          </motion.div>
        )}

        {/* Latest draw */}
        {latestDraw && (
          <motion.div custom={7} initial="hidden" animate="visible" variants={fadeUp} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" />
                Latest Draw — {latestDraw.month}
              </h2>
              <Link to="/dashboard/draws" className="text-xs text-accent hover:underline flex items-center gap-1">
                View draws <ArrowRight size={12} />
              </Link>
            </div>
            {latestDraw.drawn_numbers?.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {latestDraw.drawn_numbers.map((n, i) => (
                  <div key={i} className="number-ball w-10 h-10 text-sm">{n}</div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Draw not yet completed</p>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
