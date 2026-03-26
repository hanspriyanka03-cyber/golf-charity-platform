import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { User, Lock, CreditCard, Bell, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { authApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { subscription, cancelSubscription, isCancelling, checkout, isCheckingOut, plans } = useSubscription()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const passwordMutation = useMutation({
    mutationFn: ({ current_password, new_password }: PasswordFormData) =>
      authApi.changePassword(current_password, new_password),
    onSuccess: () => {
      toast.success('Password changed successfully!')
      reset()
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    },
  })

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
            <User size={16} className="text-accent" />
            Profile
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-background">
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-text-primary text-lg">{user?.full_name || 'No name set'}</p>
              <p className="text-sm text-text-muted">{user?.email}</p>
              <Badge variant="status" status={user?.role || 'user'} className="mt-1">{user?.role}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-xs text-text-muted">Member since</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
              </p>
            </div>
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-xs text-text-muted">Charity %</p>
              <p className="text-sm font-medium text-accent mt-0.5">{user?.charity_percentage}%</p>
            </div>
          </div>
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Lock size={16} className="text-accent" />
            Change Password
          </h2>
          <form onSubmit={handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-3">
            <Input
              label="Current Password"
              type="password"
              error={errors.current_password?.message}
              {...register('current_password')}
            />
            <Input
              label="New Password"
              type="password"
              error={errors.new_password?.message}
              {...register('new_password')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />
            <Button type="submit" isLoading={passwordMutation.isPending} size="sm">
              Change Password
            </Button>
          </form>
        </motion.div>

        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-accent" />
            Subscription
          </h2>

          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl">
                <span className="text-sm text-text-secondary">Plan</span>
                <span className="text-sm font-medium text-text-primary capitalize">{subscription.plan_type}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl">
                <span className="text-sm text-text-secondary">Status</span>
                <Badge variant="status" status={subscription.status}>{subscription.status}</Badge>
              </div>
              {subscription.current_period_end && (
                <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl">
                  <span className="text-sm text-text-secondary">Next renewal</span>
                  <span className="text-sm text-text-primary">{formatDate(subscription.current_period_end)}</span>
                </div>
              )}

              {subscription.status === 'active' && (
                <div>
                  {!showCancelConfirm ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      Cancel Subscription
                    </Button>
                  ) : (
                    <div className="p-4 bg-error/10 border border-error/30 rounded-xl">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
                        <p className="text-sm text-text-secondary">
                          Are you sure? You'll lose access to draws and your charity contributions will stop.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setShowCancelConfirm(false)}>Keep it</Button>
                        <Button variant="danger" size="sm" isLoading={isCancelling} onClick={() => cancelSubscription()}>
                          Yes, Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-text-secondary text-sm mb-4">No active subscription</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {plans.map(plan => (
                  <Button
                    key={plan.plan_type}
                    variant={plan.plan_type === 'monthly' ? 'primary' : 'secondary'}
                    size="sm"
                    isLoading={isCheckingOut}
                    onClick={() => checkout(plan.plan_type as 'monthly' | 'yearly')}
                  >
                    {plan.plan_type === 'monthly' ? 'Monthly (£9.99)' : 'Yearly (£99.99)'}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 border-error/20"
        >
          <h2 className="font-semibold text-error flex items-center gap-2 mb-4">
            <AlertTriangle size={16} />
            Account
          </h2>
          <Button variant="danger" size="sm" onClick={logout}>
            Log Out
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
