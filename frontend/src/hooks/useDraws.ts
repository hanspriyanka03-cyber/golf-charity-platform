import { useQuery } from '@tanstack/react-query'
import { drawsApi } from '../lib/api'
import { useAuth } from './useAuth'

export function useDraws() {
  const { isAuthenticated } = useAuth()

  const { data: draws, isLoading: drawsLoading } = useQuery({
    queryKey: ['draws'],
    queryFn: () => drawsApi.listDraws().then(r => r.data),
  })

  const { data: myResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['my-draw-results'],
    queryFn: () => drawsApi.myResults().then(r => r.data),
    enabled: isAuthenticated,
  })

  return {
    draws: draws || [],
    myResults: myResults || [],
    drawsLoading,
    resultsLoading,
  }
}

export function useDraw(drawId: string) {
  return useQuery({
    queryKey: ['draw', drawId],
    queryFn: () => drawsApi.getDraw(drawId).then(r => r.data),
    enabled: !!drawId,
  })
}
