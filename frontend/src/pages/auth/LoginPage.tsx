import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Trophy, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: string })?.from || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string }
      toast.error(err.response?.data?.detail || err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
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

        <div className="glass-card p-8 border-border/50">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
            <p className="text-text-secondary text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="Your password"
              error={errors.password?.message}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-surface" />
                Remember me
              </label>
              <a href="#" className="text-sm text-accent hover:underline">Forgot password?</a>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full mt-2" size="lg">
              Sign In
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-surface-2 rounded-xl border border-border/50">
            <p className="text-xs text-text-muted font-medium mb-1.5">Demo Credentials:</p>
            <div className="space-y-1">
              <p className="text-xs text-text-secondary">
                <span className="text-accent">Admin:</span> admin@golf.com / admin123
              </p>
              <p className="text-xs text-text-secondary">
                <span className="text-primary-300">User:</span> test@golf.com / test123
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-text-secondary mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent hover:underline font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
