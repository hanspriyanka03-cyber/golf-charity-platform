import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye, Check, X, DollarSign, ImageIcon } from 'lucide-react'
import { adminApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, getMatchLabel, formatDate } from '../../lib/utils'
import type { Winner } from '../../types'

export default function AdminWinners() {
  const [verificationFilter, setVerificationFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [viewingWinner, setViewingWinner] = useState<Winner | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const queryClient = useQueryClient()

  const { data: winners, isLoading } = useQuery({
    queryKey: ['admin-winners', verificationFilter, paymentFilter],
    queryFn: () => adminApi.listWinners({
      verification_status: verificationFilter || undefined,
      payment_status: paymentFilter || undefined,
    }).then(r => r.data),
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes?: string }) =>
      adminApi.verifyWinner(id, status, notes),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-winners'] })
      toast.success(`Winner ${vars.status}`)
      setViewingWinner(null)
    },
    onError: () => toast.error('Failed to update winner'),
  })

  const payoutMutation = useMutation({
    mutationFn: (id: string) => adminApi.markPayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-winners'] })
      toast.success('Winner marked as paid')
    },
    onError: () => toast.error('Failed to mark as paid'),
  })

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Winners</h1>
          <p className="text-text-secondary text-sm mt-0.5">Verify proofs and manage prize payouts</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={verificationFilter}
            onChange={e => setVerificationFilter(e.target.value)}
            className="input-field max-w-[180px]"
          >
            <option value="">All verification</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="input-field max-w-[180px]"
          >
            <option value="">All payment status</option>
            <option value="pending">Payment Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Winner</th>
                    <th>Draw</th>
                    <th>Match</th>
                    <th>Prize</th>
                    <th>Verification</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(winners as Winner[])?.map(winner => (
                    <tr key={winner.id}>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{winner.user_name || '—'}</p>
                          <p className="text-xs text-text-muted">{winner.user_email}</p>
                        </div>
                      </td>
                      <td className="text-sm text-text-secondary">{winner.draw_month || '—'}</td>
                      <td>
                        <span className={`text-sm font-medium ${winner.match_count === 5 ? 'text-accent' : 'text-primary-400'}`}>
                          {winner.match_count} match
                        </span>
                      </td>
                      <td className="text-sm font-bold text-accent">
                        {formatCurrency(winner.prize_amount || 0)}
                      </td>
                      <td>
                        <Badge variant="status" status={winner.verification_status}>
                          {winner.verification_status}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="status" status={winner.payment_status}>
                          {winner.payment_status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setViewingWinner(winner)}>
                            <Eye size={14} />
                          </Button>
                          {winner.verification_status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-success hover:bg-success/10"
                                onClick={() => verifyMutation.mutate({ id: winner.id, status: 'approved' })}
                                isLoading={verifyMutation.isPending}
                              >
                                <Check size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error hover:bg-error/10"
                                onClick={() => verifyMutation.mutate({ id: winner.id, status: 'rejected' })}
                              >
                                <X size={14} />
                              </Button>
                            </>
                          )}
                          {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-accent hover:bg-accent/10"
                              isLoading={payoutMutation.isPending}
                              onClick={() => payoutMutation.mutate(winner.id)}
                            >
                              <DollarSign size={14} />
                              Pay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!winners || winners.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center text-text-muted py-8">No winners found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View winner modal */}
      <Modal isOpen={!!viewingWinner} onClose={() => setViewingWinner(null)} title="Winner Details">
        {viewingWinner && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Name', value: viewingWinner.user_name || '—' },
                { label: 'Email', value: viewingWinner.user_email || '—' },
                { label: 'Draw Month', value: viewingWinner.draw_month || '—' },
                { label: 'Match Type', value: getMatchLabel(viewingWinner.match_count) },
                { label: 'Prize', value: formatCurrency(viewingWinner.prize_amount || 0) },
                { label: 'Created', value: viewingWinner.created_at ? formatDate(viewingWinner.created_at) : '—' },
              ].map(item => (
                <div key={item.label} className="bg-surface-2 rounded-xl p-3">
                  <p className="text-xs text-text-muted">{item.label}</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5 truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Proof image */}
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Proof Upload</p>
              {viewingWinner.proof_url ? (
                <div className="bg-surface-2 rounded-xl p-3 flex items-center gap-2">
                  <ImageIcon size={16} className="text-accent" />
                  <a
                    href={viewingWinner.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline truncate"
                  >
                    {viewingWinner.proof_url}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-text-muted">No proof uploaded yet</p>
              )}
            </div>

            {viewingWinner.admin_notes && (
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Admin Notes</p>
                <p className="text-sm text-text-muted bg-surface-2 rounded-xl p-3">{viewingWinner.admin_notes}</p>
              </div>
            )}

            {viewingWinner.verification_status === 'pending' && (
              <div className="space-y-3">
                <textarea
                  className="input-field min-h-[60px] resize-none text-sm"
                  placeholder="Add admin notes (optional)..."
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    isLoading={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: viewingWinner.id, status: 'rejected', notes: rejectNotes })}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    isLoading={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: viewingWinner.id, status: 'approved', notes: rejectNotes })}
                  >
                    <Check size={14} />
                    Approve
                  </Button>
                </div>
              </div>
            )}

            {viewingWinner.verification_status === 'approved' && viewingWinner.payment_status === 'pending' && (
              <Button
                className="w-full"
                isLoading={payoutMutation.isPending}
                onClick={() => payoutMutation.mutate(viewingWinner.id)}
              >
                <DollarSign size={16} />
                Mark as Paid
              </Button>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
