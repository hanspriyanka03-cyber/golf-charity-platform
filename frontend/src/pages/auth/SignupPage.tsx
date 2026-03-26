import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Trophy, Eye, EyeOff, Heart, Check, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { charitiesApi, subscriptionApi } from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import CharityCard from '../../components/features/CharityCard'
import SubscriptionCard from '../../components/features/SubscriptionCard'
import type { Charity, Plan } from '../../types'

const step1Schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type Step1Data = z.infer<typeof step1Schema>

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
}

export default function SignupPage() {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state across steps
  const [accountData, setAccountData] = useState<Step1Data | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null)
  const [charityPercentage, setCharityPercentage] = useState(10)

  const { data: charities, isLoading: charitiesLoading } = useQuery({
    queryKey: ['charities'],
    queryFn: () => charitiesApi.listCharities().then(r => r.data),
    retry: 2,
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.getPlans().then(r => r.data),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  })

  const goNext = () => {
    setDirection(1)
    setStep(s => s + 1)
  }

  const goPrev = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const onStep1Submit = (data: Step1Data) => {
    setAccountData(data)
    goNext()
  }

  const onSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    goNext()
  }

  const onFinalSubmit = async () => {
    if (!accountData) return
    setIsLoading(true)
    try {
      await authRegister({
        email: accountData.email,
        password: accountData.password,
        full_name: accountData.full_name,
        charity_id: selectedCharity?.id,
        charity_percentage: charityPercentage,
      })

      // Redirect to checkout if plan selected
      if (selectedPlan) {
        const checkout = await subscriptionApi.createCheckout(selectedPlan.plan_type as 'monthly' | 'yearly')
        window.location.href = checkout.data.checkout_url
      } else {
        toast.success('Account created successfully!')
        navigate('/dashboard')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string }
      toast.error(err.response?.data?.detail || err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { label: 'Account', num: 1 },
    { label: 'Plan', num: 2 },
    { label: 'Charity', num: 3 },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-glow-green">
              <Trophy size={20} className="text-accent" />
            </div>
            <span className="font-bold text-xl">
              <span className="text-text-primary">Golf</span>
              <span className="gradient-text">Give</span>
            </span>
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                step > s.num
                  ? 'bg-accent text-background'
                  : step === s.num
                  ? 'bg-primary border-2 border-accent text-white'
                  : 'bg-surface border border-border text-text-muted'
              }`}>
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? 'text-text-primary' : 'text-text-muted'}`}>
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${step > s.num ? 'bg-accent' : 'bg-border'} transition-all`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Account */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Create your account</h2>
                  <p className="text-text-secondary text-sm mt-1">Start your golf charity journey</p>
                </div>

                <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="James McAllister"
                    error={errors.full_name?.message}
                    leftIcon={<User size={16} />}
                    {...register('full_name')}
                  />
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    leftIcon={<Mail size={16} />}
                    {...register('email')}
                  />
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    error={errors.password?.message}
                    leftIcon={<Lock size={16} />}
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    {...register('password')}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat your password"
                    error={errors.confirm_password?.message}
                    leftIcon={<Lock size={16} />}
                    {...register('confirm_password')}
                  />
                  <Button type="submit" size="lg" className="w-full mt-2">
                    Continue to Plan Selection
                  </Button>
                </form>

                <p className="text-center text-sm text-text-secondary mt-5">
                  Already have an account?{' '}
                  <Link to="/login" className="text-accent hover:underline">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* Step 2: Plan */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <button onClick={goPrev} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5 transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Choose your plan</h2>
                  <p className="text-text-secondary text-sm mt-1">Unlock monthly draws and charity giving</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {plans?.map(plan => (
                    <SubscriptionCard
                      key={plan.plan_type}
                      plan={plan}
                      isPopular={plan.plan_type === 'monthly'}
                      onSelect={onSelectPlan}
                    />
                  ))}
                </div>

                <Button variant="ghost" onClick={goNext} className="w-full text-text-muted hover:text-text-secondary">
                  Skip for now — browse without subscription
                </Button>
              </motion.div>
            )}

            {/* Step 3: Charity */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <button onClick={goPrev} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5 transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Choose your charity</h2>
                  <p className="text-text-secondary text-sm mt-1">Min 10% of your subscription goes to your chosen charity</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 max-h-[320px] overflow-y-auto">
                  {charitiesLoading ? (
                    <div className="col-span-2 flex justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" />
                    </div>
                  ) : !charities || charities.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-text-muted text-sm">
                      No charities available yet — you can choose one from your dashboard later.
                    </div>
                  ) : charities.map(charity => (
                    <CharityCard
                      key={charity.id}
                      charity={charity}
                      compact
                      isSelected={selectedCharity?.id === charity.id}
                      showSelectButton
                      onSelect={setSelectedCharity}
                    />
                  ))}
                </div>

                {selectedCharity && (
                  <div className="mb-5 p-4 bg-accent/10 border border-accent/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart size={15} className="text-accent" />
                      <span className="text-sm font-medium text-text-primary">
                        Your contribution to <span className="text-accent">{selectedCharity.name}</span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>Charity percentage: {charityPercentage}%</span>
                        <span className="text-accent font-medium">Minimum 10%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={charityPercentage}
                        onChange={e => setCharityPercentage(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={onFinalSubmit}
                  isLoading={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {selectedPlan
                    ? `Create Account & Subscribe`
                    : 'Create Account'}
                </Button>

                {!selectedCharity && (
                  <Button variant="ghost" onClick={onFinalSubmit} isLoading={isLoading} className="w-full mt-2 text-text-muted">
                    Skip — choose charity later
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
