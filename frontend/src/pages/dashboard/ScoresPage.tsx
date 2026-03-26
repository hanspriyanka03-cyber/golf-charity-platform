import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Target, Info } from 'lucide-react'
import { useScores } from '../../hooks/useScores'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ScoreEntry from '../../components/features/ScoreEntry'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatDate, scoreToColor } from '../../lib/utils'
import type { Score } from '../../types'

export default function ScoresPage() {
  const { scores, isLoading, addScore, updateScore, deleteScore, isAdding, isUpdating, isDeleting } = useScores()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingScore, setEditingScore] = useState<Score | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddScore = ({ score, datePlayed }: { score: number; datePlayed: string }) => {
    addScore({ score, datePlayed }, {
      onSuccess: () => setShowAddModal(false),
    })
  }

  const handleUpdateScore = ({ score, datePlayed }: { score: number; datePlayed: string }) => {
    if (!editingScore) return
    updateScore({ id: editingScore.id, score, datePlayed }, {
      onSuccess: () => setEditingScore(null),
    })
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    deleteScore(id, {
      onSuccess: () => setDeletingId(null),
      onError: () => setDeletingId(null),
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Scores</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              Your Stableford scores — these are your draw entries
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            disabled={scores.length >= 5}
            size="sm"
          >
            <Plus size={16} />
            Add Score
          </Button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <Info size={16} className="text-primary-400 shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-0.5">Rolling Window</p>
            <p>You can have up to 5 scores. When you add a 6th, the oldest is automatically removed. Scores must be Stableford points (1–45).</p>
          </div>
        </div>

        {/* Scores list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" />
          </div>
        ) : scores.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <Target size={28} className="text-text-muted" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">No scores yet</h3>
            <p className="text-sm text-text-secondary mb-5">Add your first Stableford score to start participating in draws</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add First Score
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((score, idx) => (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${scoreToColor(score.score)} flex flex-col items-center justify-center shrink-0`}>
                  <span className="text-2xl font-black text-white">{score.score}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-primary text-lg">{score.score} points</span>
                    {idx === 0 && <Badge variant="gold" className="text-xs">Latest</Badge>}
                    {idx === scores.length - 1 && scores.length === 5 && (
                      <Badge className="text-xs bg-surface border-border text-text-muted">Oldest</Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">Played: {formatDate(score.date_played)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingScore(score)}
                    className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(score.id)}
                    disabled={deletingId === score.id}
                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Score count indicator */}
        {scores.length > 0 && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                className={`h-2 flex-1 rounded-full transition-all ${
                  n <= scores.length ? 'bg-accent' : 'bg-surface border border-border'
                }`}
              />
            ))}
            <span className="text-xs text-text-muted ml-1">{scores.length}/5</span>
          </div>
        )}
      </div>

      {/* Add score modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Score">
        <ScoreEntry
          onSubmit={handleAddScore}
          isLoading={isAdding}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit score modal */}
      <Modal isOpen={!!editingScore} onClose={() => setEditingScore(null)} title="Edit Score">
        {editingScore && (
          <ScoreEntry
            onSubmit={handleUpdateScore}
            isLoading={isUpdating}
            defaultValues={{
              score: editingScore.score,
              date_played: editingScore.date_played,
            }}
            onCancel={() => setEditingScore(null)}
          />
        )}
      </Modal>
    </DashboardLayout>
  )
}
