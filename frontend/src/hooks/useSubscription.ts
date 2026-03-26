import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subscriptionApi } from '../lib/api'
import { useAuth } from './useAuth'

export function useSubscription() {
  const { isAuthenticated, refreshUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription().then(r => r.data),
    enabled: isAuthenticated,
  })

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.getPlans().then(r => r.data),
  })

  const checkoutMutation = useMutation({
    mutationFn: (planType: 'monthly' | 'yearly') =>
      subscriptionApi.createCheckout(planType),
    onSuccess: (data) => {
      window.location.href = data.data.checkout_url
    },
    onError: () => {
      toast.error('Failed to create checkout session')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      refreshUser()
      toast.success('Subscription cancelled')
    },
    onError: () => {
      toast.error('Failed to cancel subscription')
    },
  })

  return {
    subscription,
    plans: plans || [],
    isLoading,
    plansLoading,
    checkout: checkoutMutation.mutate,
    cancelSubscription: cancelMutation.mutate,
    isCheckingOut: checkoutMutation.isPending,
    isCancelling: cancelMutation.isPending,
  }
}
