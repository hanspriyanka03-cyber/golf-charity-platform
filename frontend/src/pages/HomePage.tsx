import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useAnimation } from 'framer-motion'
import {
  ArrowRight,
  Trophy,
  Heart,
  Target,
  ChevronRight,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { charitiesApi, subscriptionApi } from '../lib/api'
import CharityCard from '../components/features/CharityCard'
import SubscriptionCard from '../components/features/SubscriptionCard'
import { formatCurrency } from '../lib/utils'

// Animated counter hook
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return { count, ref }
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const numberBallVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: (i: number) => ({
    scale: 1,
    rotate: 0,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 200, damping: 15 },
  }),
}

const DEMO_NUMBERS = [7, 15, 23, 31, 42]

export default function HomePage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const { data: charities } = useQuery({
    queryKey: ['charities'],
    queryFn: () => charitiesApi.listCharities().then(r => r.data),
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.getPlans().then(r => r.data),
  })

  const { count: membersCount, ref: membersRef } = useAnimatedCounter(2847)
  const { count: donationsCount, ref: donationsRef } = useAnimatedCounter(124500)
  const { count: drawsCount, ref: drawsRef } = useAnimatedCounter(48)

  const featuredCharity = charities?.find(c => c.is_featured) || charities?.[0]
  const filteredPlans = plans?.filter(p => p.plan_type === billingPeriod) || []

  return (
    <div className="min-h-screen">
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Animated background */}
        <div className="absolute inset-0 animated-gradient" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
                <Zap size={14} />
                Monthly Prizes + Real Charity Impact
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6"
              >
                <span className="text-text-primary">Play.</span>
                <br />
                <span className="gradient-text">Give.</span>
                <br />
                <span className="text-text-primary">Win.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg sm:text-xl text-text-secondary max-w-xl mb-8 leading-relaxed text-balance"
              >
                Enter your Stableford scores each month. Your numbers go into a live draw.
                Match 3, 4, or 5 and win cash — while your subscription funds the charities you love.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/signup"
                  className="btn-primary text-base px-8 py-4 animate-pulse-glow group"
                >
                  Start Your Journey
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="btn-secondary text-base px-8 py-4 group"
                >
                  How It Works
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['#1a472a', '#c9a84c', '#2a7340', '#e4b33c', '#163d24'].map((bg, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-background"
                      style={{ backgroundColor: bg }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={14} className="text-accent fill-accent" />
                  ))}
                  <span className="text-sm text-text-secondary ml-1">2,847 active members</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Draw visualization */}
            <motion.div
              className="flex-1 flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative w-full max-w-md">
                {/* Main card */}
                <div className="glass-card p-8 border-accent/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider">March 2025 Draw</p>
                        <p className="text-lg font-bold text-text-primary">Live Draw Results</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-success/15 border border-success/30 px-2.5 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-medium text-success">Published</span>
                      </div>
                    </div>

                    {/* Number balls */}
                    <div className="flex justify-center gap-3 mb-6">
                      {DEMO_NUMBERS.map((num, i) => (
                        <motion.div
                          key={i}
                          custom={i}
                          variants={numberBallVariants}
                          initial="hidden"
                          animate="visible"
                          className="number-ball w-12 h-12 text-base animate-float"
                          style={{ animationDelay: `${i * 0.3}s` }}
                        >
                          {num}
                        </motion.div>
                      ))}
                    </div>

                    {/* Prize tiers */}
                    <div className="space-y-2.5">
                      {[
                        { label: '5-Number Match', pool: '£2,840', winners: 1, highlight: true },
                        { label: '4-Number Match', pool: '£2,485', winners: 7, highlight: false },
                        { label: '3-Number Match', pool: '£1,775', winners: 23, highlight: false },
                      ].map((tier, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-xl ${
                            tier.highlight
                              ? 'bg-accent/15 border border-accent/30'
                              : 'bg-surface border border-border/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Trophy size={14} className={tier.highlight ? 'text-accent' : 'text-text-muted'} />
                            <span className="text-sm text-text-secondary">{tier.label}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${tier.highlight ? 'text-accent' : 'text-text-primary'}`}>
                              {tier.pool}
                            </span>
                            <span className="text-xs text-text-muted ml-2">÷ {tier.winners}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Heart size={18} className="text-error" />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">Min. 10% to charity</p>
                          <p className="text-xs text-text-muted">You choose which charity to support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-accent text-background text-xs font-bold px-3 py-1.5 rounded-full shadow-glow-gold"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Jackpot Rolls Over!
                </motion.div>
                <motion.div
                  className="absolute -bottom-4 -left-4 glass-card text-xs px-3 py-2 border-border/50"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={12} className="text-accent" />
                    <span className="text-text-secondary">Verified & Secure</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-border/50 flex items-start justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-accent/60 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center" ref={membersRef}>
              <p className="text-5xl font-black gradient-text-green">{membersCount.toLocaleString()}</p>
              <p className="text-text-secondary mt-1 flex items-center justify-center gap-1.5">
                <Users size={14} className="text-text-muted" />
                Active Members
              </p>
            </div>
            <div className="text-center" ref={donationsRef}>
              <p className="text-5xl font-black gradient-text">{formatCurrency(donationsCount)}</p>
              <p className="text-text-secondary mt-1 flex items-center justify-center gap-1.5">
                <Heart size={14} className="text-text-muted" />
                Donated to Charity
              </p>
            </div>
            <div className="text-center" ref={drawsRef}>
              <p className="text-5xl font-black text-text-primary">{drawsCount}</p>
              <p className="text-text-secondary mt-1 flex items-center justify-center gap-1.5">
                <Trophy size={14} className="text-text-muted" />
                Draws Completed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="section-label mb-3">Simple Process</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-text-primary">
              How It <span className="gradient-text">Works</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 relative"
          >
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[calc(33%-12px)] right-[calc(33%-12px)] h-0.5 bg-gradient-to-r from-primary/30 via-accent/50 to-primary/30" />

            {[
              {
                step: '01',
                icon: <Zap size={28} className="text-accent" />,
                title: 'Subscribe',
                desc: 'Choose your plan — monthly or yearly. From £9.99/month. Cancel anytime.',
                color: 'from-accent/20 to-accent/5',
                border: 'border-accent/20',
              },
              {
                step: '02',
                icon: <Target size={28} className="text-primary-400" />,
                title: 'Enter Your Scores',
                desc: 'Submit up to 5 Stableford scores (1–45) each month. New scores roll in as you play.',
                color: 'from-primary/20 to-primary/5',
                border: 'border-primary/20',
              },
              {
                step: '03',
                icon: <Trophy size={28} className="text-accent" />,
                title: 'Win & Give',
                desc: 'Monthly draw selects 5 numbers. Match 3, 4, or 5 to win. Min 10% always goes to charity.',
                color: 'from-accent/20 to-accent/5',
                border: 'border-accent/20',
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className={`glass-card p-7 border ${step.border} relative`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center mb-5`}>
                  {step.icon}
                </div>
                <div className="absolute top-5 right-5 text-5xl font-black text-border/30">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{step.title}</h3>
                <p className="text-text-secondary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── DRAW MECHANICS ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/20 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="section-label mb-3">Draw System</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl font-black text-text-primary mb-5">
                Your Scores Are Your <span className="gradient-text">Lucky Numbers</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-text-secondary leading-relaxed mb-6">
                Each month, 5 numbers (1–45) are drawn. Your submitted Stableford scores become your entries.
                The more scores you have, the more chances to match.
              </motion.p>

              <motion.div variants={stagger} className="space-y-4">
                {[
                  { match: '5 Numbers', prize: '40% of pool', desc: 'Jackpot! Rolls over if no winner', icon: '🏆', color: 'text-accent' },
                  { match: '4 Numbers', prize: '35% of pool', desc: 'Split equally among winners', icon: '🥇', color: 'text-primary-300' },
                  { match: '3 Numbers', prize: '25% of pool', desc: 'Split equally among winners', icon: '🥈', color: 'text-primary-400' },
                ].map((tier, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="flex items-center gap-4 p-4 glass-card hover:border-border/70 transition-all"
                  >
                    <div className="text-2xl">{tier.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-bold ${tier.color}`}>{tier.match}</p>
                        <p className="text-sm font-semibold text-text-primary">{tier.prize}</p>
                      </div>
                      <p className="text-sm text-text-muted">{tier.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Visual draw demo */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="glass-card p-8 border-primary/20">
                <p className="text-sm text-text-muted mb-5 text-center uppercase tracking-wider">Example Draw</p>

                <div className="mb-6">
                  <p className="text-xs text-text-muted mb-3 uppercase tracking-wider">Drawn Numbers</p>
                  <div className="flex justify-center gap-3">
                    {DEMO_NUMBERS.map((n, i) => (
                      <div key={i} className="number-ball w-12 h-12 text-base">{n}</div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Player Examples</p>
                  {[
                    { player: 'James M.', scores: [7, 15, 23, 31, 42], matched: 5, prize: '£2,840', won: true },
                    { player: 'Sarah K.', scores: [7, 15, 20, 31, 38], matched: 4, prize: '£354', won: true },
                    { player: 'Tom B.', scores: [7, 15, 19, 28, 39], matched: 3, prize: '£77', won: true },
                    { player: 'Lisa P.', scores: [2, 9, 17, 28, 38], matched: 0, prize: '–', won: false },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        p.won ? 'bg-success/5 border border-success/20' : 'bg-surface border border-border/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-accent">
                          {p.player[0]}
                        </div>
                        <span className="text-sm text-text-secondary">{p.player}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{p.matched}/5 matched</span>
                        <span className={`text-sm font-bold ${p.won ? 'text-accent' : 'text-text-muted'}`}>{p.prize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED CHARITY ──────────────────────────────────────────────── */}
      {featuredCharity && (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-12"
            >
              <motion.p variants={fadeUp} className="section-label mb-3">Making a Difference</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl font-black text-text-primary">
                Featured <span className="gradient-text">Charity</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <CharityCard charity={featuredCharity} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <Link
                to="/charities"
                className="btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2"
              >
                View All Charities
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/20 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} className="section-label mb-3">Simple Pricing</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
              Join the <span className="gradient-text">Community</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-text-secondary max-w-lg mx-auto text-lg mb-8">
              One simple subscription unlocks draws, prizes, and charity giving every month.
            </motion.p>

            {/* Toggle */}
            <motion.div variants={fadeUp} className="inline-flex items-center bg-surface border border-border rounded-xl p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-accent text-background shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-accent text-background shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Yearly
                <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded-full">Save 17%</span>
              </button>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <div className="mb-5">
                <p className="text-sm font-semibold text-text-primary mb-3">Visitor</p>
                <p className="text-4xl font-black text-text-primary">Free</p>
              </div>
              <ul className="space-y-2.5 mb-6">
                {['View all charities', 'See draw results', 'Learn about prizes', 'No draws or prizes'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className={i < 3 ? 'text-text-muted' : 'text-error'}>
                      {i < 3 ? '•' : '✕'}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-secondary w-full text-center block">
                Browse Free
              </Link>
            </motion.div>

            {filteredPlans.map((plan, idx) => (
              <SubscriptionCard
                key={plan.plan_type}
                plan={plan}
                isPopular={plan.plan_type === 'monthly'}
                onSelect={() => window.location.href = '/signup'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              className="glass-card p-12 border-accent/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex justify-center mb-6">
                  <div className="flex gap-3">
                    {[7, 15, 23].map((n, i) => (
                      <div key={i} className="number-ball w-12 h-12 text-base">{n}</div>
                    ))}
                    <div className="flex items-center gap-1 text-text-muted text-2xl font-light">...</div>
                  </div>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
                  Your Numbers. <br />
                  <span className="gradient-text">Their Future.</span>
                </h2>
                <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
                  Join 2,847 golfers making every round count — for themselves, and for the causes that matter.
                </p>
                <Link
                  to="/signup"
                  className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 animate-pulse-glow"
                >
                  Start Playing, Start Giving
                  <ArrowRight size={20} />
                </Link>
                <p className="text-xs text-text-muted mt-4">Cancel anytime. Min. 10% always to charity.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
