import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Play, Send, Eye, Dices } from 'lucide-react'
import { adminApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency } from '../../lib/utils'
import type { Draw } from '../../types'

export default function AdminDraws() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSimResults, setShowSimResults] = useState<{ draw: Draw; results: object } | null>(null)
  const [newMonth, setNewMonth] = useState('')
  const [newDrawType, setNewDrawType] = useState<'random' | 'algorithmic'>('random')
  const queryClient = useQueryClient()

  const { data: draws, isLoading } = useQuery({
    queryKey: ['admin-draws'],
    queryFn: () => adminApi.listAdminDraws().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createDraw(newMonth, newDrawType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-draws'] })
      toast.success('Draw created!')
      setShowCreateModal(false)
      setNewMonth('')
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || 'Failed to create draw')
    },
  })

  const simulateMutation = useMutation({
    mutationFn: (drawId: string) => adminApi.simulateDraw(drawId),
    onSuccess: (data, drawId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-draws'] })
      const draw = draws?.find(d => d.id === drawId)
      if (draw) setShowSimResults({ draw, results: data.data })
      toast.success('Simulation complete!')
    },
    onError: () => toast.error('Failed to simulate draw'),
  })

  const publishMutation = useMutation({
    mutationFn: (drawId: string) => adminApi.publishDraw(drawId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-draws'] })
      toast.success('Draw published! Winners notified.')
    },
    onError: () => toast.error('Failed to publish draw'),
  })

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Draws Management</h1>
            <p className="text-text-secondary text-sm mt-0.5">Create, simulate, and publish monthly draws</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus size={16} />
            New Draw
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="space-y-3">
            {draws?.map((draw, idx) => (
              <motion.div
                key={draw.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-text-primary">{draw.month}</h3>
                      <Badge variant="status" status={draw.status}>{draw.status}</Badge>
                      <Badge variant={draw.draw_type === 'algorithmic' ? 'gold' : 'default'} className="text-xs">
                        {draw.draw_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span>Pool: {formatCurrency(draw.prize_pool_total)}</span>
                      <span>Jackpot: {formatCurrency(draw.jackpot_amount)}</span>
                    </div>

                    {/* Drawn numbers */}
                    {draw.drawn_numbers?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {draw.drawn_numbers.map((n, i) => (
                          <div key={i} className="number-ball w-8 h-8 text-xs">{n}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {draw.status !== 'published' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={simulateMutation.isPending && simulateMutation.variables === draw.id}
                        onClick={() => simulateMutation.mutate(draw.id)}
                      >
                        <Play size={14} />
                        Simulate
                      </Button>
                    )}
                    {draw.status === 'simulated' && (
                      <Button
                        size="sm"
                        isLoading={publishMutation.isPending && publishMutation.variables === draw.id}
                        onClick={() => {
                          if (confirm(`Publish ${draw.month} draw? This will notify all winners.`)) {
                            publishMutation.mutate(draw.id)
                          }
                        }}
                      >
                        <Send size={14} />
                        Publish
                      </Button>
                    )}
                    {draw.simulation_results && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSimResults({ draw, results: draw.simulation_results! })}
                      >
                        <Eye size={14} />
                        Results
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {(!draws || draws.length === 0) && (
              <div className="glass-card p-12 text-center">
                <Dices size={40} className="text-text-muted mx-auto mb-4" />
                <h3 className="font-semibold text-text-primary mb-2">No draws yet</h3>
                <p className="text-sm text-text-secondary mb-4">Create your first monthly draw</p>
                <Button onClick={() => setShowCreateModal(true)} size="sm">
                  <Plus size={14} /> Create Draw
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create draw modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Draw">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Draw Month</label>
            <input
              type="month"
              className="input-field"
              value={newMonth}
              onChange={e => setNewMonth(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Draw Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['random', 'algorithmic'].map(type => (
                <button
                  key={type}
                  onClick={() => setNewDrawType(type as 'random' | 'algorithmic')}
                  className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all capitalize ${
                    newDrawType === type
                      ? 'bg-accent/15 border-accent/30 text-accent'
                      : 'bg-surface border-border text-text-secondary hover:border-accent/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {newDrawType === 'algorithmic'
                ? 'Weighted by score frequency — less frequent scores have higher draw probability'
                : 'Pure random — equal chance for all numbers 1–45'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
            <Button
              isLoading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              disabled={!newMonth}
              className="flex-1"
            >
              Create Draw
            </Button>
          </div>
        </div>
      </Modal>

      {/* Simulation results modal */}
      <Modal
        isOpen={!!showSimResults}
        onClose={() => setShowSimResults(null)}
        title={`Simulation Results — ${showSimResults?.draw.month}`}
        size="lg"
      >
        {showSimResults && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted mb-2">Drawn Numbers</p>
              <div className="flex gap-2">
                {((showSimResults.results as { drawn_numbers?: number[] }).drawn_numbers || []).map((n: number, i: number) => (
                  <div key={i} className="number-ball w-10 h-10 text-sm">{n}</div>
                ))}
              </div>
            </div>

            {(() => {
              const r = showSimResults.results as {
                winners?: { '5_match'?: string[]; '4_match'?: string[]; '3_match'?: string[] }
                prize_breakdown?: {
                  five_match_pool?: number
                  four_match_pool?: number
                  three_match_pool?: number
                  prize_per_5_winner?: number
                  prize_per_4_winner?: number
                  prize_per_3_winner?: number
                  jackpot_rollover_to_next?: number
                }
                total_participants?: number
                total_winners?: number
              }
              const winners = r.winners || {}
              const breakdown = r.prize_breakdown || {}
              return (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '5 Match', count: (winners['5_match'] || []).length, pool: breakdown.five_match_pool, per: breakdown.prize_per_5_winner },
                      { label: '4 Match', count: (winners['4_match'] || []).length, pool: breakdown.four_match_pool, per: breakdown.prize_per_4_winner },
                      { label: '3 Match', count: (winners['3_match'] || []).length, pool: breakdown.three_match_pool, per: breakdown.prize_per_3_winner },
                    ].map(tier => (
                      <div key={tier.label} className="bg-surface-2 rounded-xl p-3 text-center">
                        <p className="text-xs text-text-muted mb-1">{tier.label}</p>
                        <p className="text-xl font-bold text-text-primary">{tier.count}</p>
                        <p className="text-xs text-accent">{formatCurrency(tier.pool || 0)}</p>
                        {(tier.per || 0) > 0 && <p className="text-xs text-text-muted">{formatCurrency(tier.per || 0)}/winner</p>}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl text-sm">
                    <span className="text-text-secondary">Total participants</span>
                    <span className="font-medium text-text-primary">{r.total_participants}</span>
                  </div>
                  {(breakdown.jackpot_rollover_to_next || 0) > 0 && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-sm">
                      <span className="text-accent font-medium">Jackpot rolls over: {formatCurrency(breakdown.jackpot_rollover_to_next || 0)}</span>
                    </div>
                  )}
                </>
              )
            })()}

            <Button
              onClick={() => {
                if (confirm('Publish this draw? Winners will be notified.')) {
                  publishMutation.mutate(showSimResults.draw.id)
                  setShowSimResults(null)
                }
              }}
              isLoading={publishMutation.isPending}
              className="w-full"
            >
              <Send size={16} />
              Publish This Draw
            </Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
