import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Target } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { cn } from '../../lib/utils'

const scoreSchema = z.object({
  score: z
    .number({ invalid_type_error: 'Score must be a number' })
    .int()
    .min(1, 'Minimum score is 1')
    .max(45, 'Maximum score is 45'),
  date_played: z.string().min(1, 'Date is required'),
})

type ScoreFormData = z.infer<typeof scoreSchema>

interface ScoreEntryProps {
  onSubmit: (data: { score: number; datePlayed: string }) => void
  isLoading?: boolean
  defaultValues?: { score?: number; date_played?: string }
  onCancel?: () => void
}

export default function ScoreEntry({ onSubmit, isLoading, defaultValues, onCancel }: ScoreEntryProps) {
  const [sliderValue, setSliderValue] = useState(defaultValues?.score || 18)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScoreFormData>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      score: defaultValues?.score || 18,
      date_played: defaultValues?.date_played || new Date().toISOString().split('T')[0],
    },
  })

  const currentScore = watch('score')

  const getScoreLabel = (score: number) => {
    if (score >= 40) return { label: 'Eagle+', color: 'text-yellow-400' }
    if (score >= 30) return { label: 'Great Round', color: 'text-green-400' }
    if (score >= 20) return { label: 'Good Round', color: 'text-primary-400' }
    return { label: 'Average Round', color: 'text-text-muted' }
  }

  const scoreInfo = getScoreLabel(currentScore || sliderValue)

  const onFormSubmit = (data: ScoreFormData) => {
    onSubmit({ score: data.score, datePlayed: data.date_played })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Score Visual */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-accent/30 flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-600 shadow-glow-green">
            <Target size={20} className="text-accent mb-1" />
            <span className="text-4xl font-black text-white">{currentScore || sliderValue}</span>
          </div>
        </div>
        <span className={`text-sm font-medium ${scoreInfo.color}`}>{scoreInfo.label}</span>
        <span className="text-xs text-text-muted">Stableford Score</span>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">
          Score: <span className="text-accent font-bold">{currentScore || sliderValue}</span>
          <span className="text-text-muted text-xs ml-1">(1–45)</span>
        </label>
        <input
          type="range"
          min="1"
          max="45"
          value={currentScore || sliderValue}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            setSliderValue(val)
            setValue('score', val, { shouldValidate: true })
          }}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-gradient-to-r from-primary-800 via-primary-500 to-accent',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-accent',
            '[&::-webkit-slider-thumb]:shadow-glow-gold',
            '[&::-webkit-slider-thumb]:cursor-pointer',
          )}
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>1</span>
          <span>15</span>
          <span>30</span>
          <span>45</span>
        </div>
      </div>

      {/* Direct number input */}
      <Input
        label="Or enter score directly"
        type="number"
        min={1}
        max={45}
        error={errors.score?.message}
        {...register('score', {
          valueAsNumber: true,
          onChange: (e) => setSliderValue(parseInt(e.target.value) || 1),
        })}
      />

      {/* Date */}
      <Input
        label="Date Played"
        type="date"
        error={errors.date_played?.message}
        max={new Date().toISOString().split('T')[0]}
        {...register('date_played')}
      />

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {defaultValues?.score ? 'Update Score' : 'Add Score'}
        </Button>
      </div>
    </form>
  )
}
