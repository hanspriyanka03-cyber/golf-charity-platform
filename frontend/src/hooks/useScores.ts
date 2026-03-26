import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { scoresApi } from '../lib/api'
import type { Score } from '../types'

export function useScores() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['scores'],
    queryFn: () => scoresApi.getScores().then(r => r.data),
  })

  const addScoreMutation = useMutation({
    mutationFn: ({ score, datePlayed }: { score: number; datePlayed: string }) =>
      scoresApi.addScore(score, datePlayed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] })
      toast.success('Score added successfully!')
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || 'Failed to add score')
    },
  })

  const updateScoreMutation = useMutation({
    mutationFn: ({ id, score, datePlayed }: { id: string; score?: number; datePlayed?: string }) =>
      scoresApi.updateScore(id, score, datePlayed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] })
      toast.success('Score updated successfully!')
    },
    onError: () => {
      toast.error('Failed to update score')
    },
  })

  const deleteScoreMutation = useMutation({
    mutationFn: (id: string) => scoresApi.deleteScore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] })
      toast.success('Score deleted')
    },
    onError: () => {
      toast.error('Failed to delete score')
    },
  })

  return {
    scores: data?.scores || [],
    total: data?.total || 0,
    isLoading,
    error,
    addScore: addScoreMutation.mutate,
    updateScore: updateScoreMutation.mutate,
    deleteScore: deleteScoreMutation.mutate,
    isAdding: addScoreMutation.isPending,
    isUpdating: updateScoreMutation.isPending,
    isDeleting: deleteScoreMutation.isPending,
  }
}
