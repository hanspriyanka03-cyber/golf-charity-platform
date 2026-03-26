import { motion } from 'framer-motion'
import { Trophy, Calendar } from 'lucide-react'
import { useDraws } from '../../hooks/useDraws'
import DashboardLayout from '../../components/layout/DashboardLayout'
import DrawCard from '../../components/features/DrawCard'
import WinningsOverview from '../../components/features/WinningsOverview'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useQuery } from '@tanstack/react-query'
import { winnersApi } from '../../lib/api'

export default function DrawsPage() {
  const { draws, myResults, drawsLoading, resultsLoading } = useDraws()

  const { data: winnings } = useQuery({
    queryKey: ['my-winnings'],
    queryFn: () => winnersApi.myWinnings().then(r => r.data),
  })

  // Build a lookup of my draw results
  const resultsByDrawId = new Map(myResults.map(r => [r.draw.id, r]))

  if (drawsLoading || resultsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Monthly Draws</h1>
          <p className="text-text-secondary text-sm mt-0.5">Your participation history and results</p>
        </div>

        {/* Winnings summary */}
        {winnings && winnings.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-accent" />
              My Winnings
            </h2>
            <WinningsOverview winners={winnings} />
          </div>
        )}

        {/* Draws */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            All Draws
          </h2>

          {draws.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Trophy size={40} className="text-text-muted mx-auto mb-4" />
              <h3 className="font-semibold text-text-primary mb-2">No draws yet</h3>
              <p className="text-sm text-text-secondary">Draws are published monthly. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draws.map((draw, idx) => (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <DrawCard
                    draw={draw}
                    userResult={resultsByDrawId.get(draw.id)}
                    showDetails
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
