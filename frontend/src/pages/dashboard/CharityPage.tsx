import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Search, DollarSign, ExternalLink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { charitiesApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import CharityCard from '../../components/features/CharityCard'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import type { Charity } from '../../types'

export default function CharityPage() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [newCharity, setNewCharity] = useState<Charity | null>(null)
  const [newPercentage, setNewPercentage] = useState(user?.charity_percentage || 10)
  const [donationAmount, setDonationAmount] = useState(25)

  const { data: currentCharity } = useQuery({
    queryKey: ['charity', user?.charity_id],
    queryFn: () => charitiesApi.getCharity(user!.charity_id!).then(r => r.data),
    enabled: !!user?.charity_id,
  })

  const { data: charities } = useQuery({
    queryKey: ['charities', search],
    queryFn: () => charitiesApi.listCharities(search || undefined).then(r => r.data),
  })

  const updateCharityMutation = useMutation({
    mutationFn: ({ charityId, percentage }: { charityId: string; percentage: number }) =>
      charitiesApi.updateMyCharity(charityId, percentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charity'] })
      refreshUser()
      toast.success('Charity updated!')
      setShowChangeModal(false)
    },
    onError: () => toast.error('Failed to update charity'),
  })

  const donateMutation = useMutation({
    mutationFn: ({ charityId, amount }: { charityId: string; amount: number }) =>
      charitiesApi.donate(charityId, amount),
    onSuccess: (data) => {
      // In production, redirect to Stripe payment
      toast.success(`Donation of £${donationAmount} to ${currentCharity?.name} initiated!`)
      setShowDonateModal(false)
    },
    onError: () => toast.error('Failed to process donation'),
  })

  const handleSaveCharity = () => {
    const chosenCharity = newCharity || currentCharity
    if (!chosenCharity) return
    updateCharityMutation.mutate({ charityId: chosenCharity.id, percentage: newPercentage })
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Charity</h1>
          <p className="text-text-secondary text-sm mt-0.5">Choose and manage your charity contribution</p>
        </div>

        {/* Current charity */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Heart size={16} className="text-error" />
            Currently Supporting
          </h2>

          {currentCharity ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                {currentCharity.image_url && (
                  <img
                    src={currentCharity.image_url}
                    alt={currentCharity.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary text-lg">{currentCharity.name}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">{currentCharity.description}</p>
                  {currentCharity.website && (
                    <a
                      href={currentCharity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"
                    >
                      Visit website <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Contribution */}
              <div className="bg-surface-2 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">My contribution rate</span>
                  <span className="text-lg font-bold text-accent">{user?.charity_percentage || 10}%</span>
                </div>
                <div className="text-xs text-text-muted">
                  {user?.subscription_status === 'active'
                    ? `You're contributing ${user.charity_percentage}% of your subscription to ${currentCharity.name}`
                    : 'Subscribe to start contributing to this charity'}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={() => setShowChangeModal(true)} className="flex-1">
                  Change Charity
                </Button>
                <Button size="sm" onClick={() => setShowDonateModal(true)} className="flex-1">
                  <DollarSign size={14} />
                  Donate Now
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Heart size={36} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary mb-4">No charity selected</p>
              <Button onClick={() => setShowChangeModal(true)}>
                Choose a Charity
              </Button>
            </div>
          )}
        </div>

        {/* Adjust percentage */}
        {currentCharity && (
          <div className="glass-card p-5">
            <h2 className="font-semibold text-text-primary mb-3">Adjust Contribution</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Charity percentage</span>
                <span className="text-accent font-bold">{newPercentage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={newPercentage}
                onChange={e => setNewPercentage(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>10% (minimum)</span>
                <span>80%</span>
              </div>
              {newPercentage !== user?.charity_percentage && (
                <Button
                  size="sm"
                  onClick={() => updateCharityMutation.mutate({ charityId: currentCharity.id, percentage: newPercentage })}
                  isLoading={updateCharityMutation.isPending}
                >
                  Save Contribution Rate
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change charity modal */}
      <Modal isOpen={showChangeModal} onClose={() => setShowChangeModal(false)} title="Choose Charity" size="lg">
        <div className="space-y-4">
          <Input
            placeholder="Search charities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {charities?.map(charity => (
              <CharityCard
                key={charity.id}
                charity={charity}
                compact
                isSelected={newCharity?.id === charity.id || (!newCharity && currentCharity?.id === charity.id)}
                showSelectButton
                onSelect={setNewCharity}
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">
              Contribution percentage: <span className="text-accent font-bold">{newPercentage}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="80"
              value={newPercentage}
              onChange={e => setNewPercentage(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowChangeModal(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSaveCharity}
              isLoading={updateCharityMutation.isPending}
              disabled={!newCharity && !currentCharity}
              className="flex-1"
            >
              Save Charity
            </Button>
          </div>
        </div>
      </Modal>

      {/* Donate modal */}
      <Modal isOpen={showDonateModal} onClose={() => setShowDonateModal(false)} title="Make a Donation">
        <div className="space-y-4">
          <div className="bg-surface-2 rounded-xl p-4 flex items-center gap-3">
            <Heart size={20} className="text-error" />
            <div>
              <p className="font-medium text-text-primary">{currentCharity?.name}</p>
              <p className="text-xs text-text-muted">One-time donation, independent of subscription</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map(amount => (
              <button
                key={amount}
                onClick={() => setDonationAmount(amount)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  donationAmount === amount
                    ? 'bg-accent/15 border-accent/30 text-accent'
                    : 'bg-surface border-border text-text-secondary hover:border-accent/50'
                }`}
              >
                £{amount}
              </button>
            ))}
          </div>

          <Input
            label="Custom amount (£)"
            type="number"
            min={1}
            value={donationAmount}
            onChange={e => setDonationAmount(parseFloat(e.target.value) || 0)}
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDonateModal(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => currentCharity && donateMutation.mutate({ charityId: currentCharity.id, amount: donationAmount })}
              isLoading={donateMutation.isPending}
              disabled={!donationAmount || donationAmount <= 0}
              className="flex-1"
            >
              <Heart size={14} />
              Donate £{donationAmount}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
