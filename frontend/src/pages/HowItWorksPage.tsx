import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Target, Trophy, Heart, Shield, RefreshCw, DollarSign, Users } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const steps = [
  {
    number: '01',
    icon: <Zap size={32} className="text-accent" />,
    title: 'Subscribe to GolfGive',
    description: 'Choose between monthly (£9.99) or yearly (£99.99) subscription. Your subscription funds the prize pool and your chosen charity.',
    details: [
      '60% of your subscription goes to the monthly prize pool',
      'Minimum 10% goes directly to your chosen charity',
      'You can increase your charity contribution voluntarily',
      'Cancel anytime — no hidden fees',
    ],
    color: 'border-accent/20 bg-accent/5',
    iconBg: 'bg-accent/15',
  },
  {
    number: '02',
    icon: <Target size={32} className="text-primary-400" />,
    title: 'Enter Your Stableford Scores',
    description: 'After each round, enter your Stableford score (1–45). These scores become your lucky numbers in the monthly draw.',
    details: [
      'Enter up to 5 scores per month',
      'Scores range from 1 to 45 (Stableford format)',
      'Rolling window: newest score replaces the oldest when you have 5',
      'Edit or delete scores at any time before the draw',
    ],
    color: 'border-primary/20 bg-primary/5',
    iconBg: 'bg-primary/15',
  },
  {
    number: '03',
    icon: <RefreshCw size={32} className="text-accent" />,
    title: 'Monthly Draw Runs',
    description: 'Every month, our system draws 5 numbers from 1–45. Draws can be random or algorithmically weighted by community score frequency.',
    details: [
      'Random draw: equal probability for all numbers 1–45',
      'Algorithmic draw: weighted by how often numbers appear in community scores',
      'All draws are transparent and verifiable',
      'Admin reviews and publishes results',
    ],
    color: 'border-accent/20 bg-accent/5',
    iconBg: 'bg-accent/15',
  },
  {
    number: '04',
    icon: <Trophy size={32} className="text-primary-400" />,
    title: 'Win Prizes',
    description: 'Match 3, 4, or 5 of your scores to the drawn numbers. The more you match, the bigger your prize.',
    details: [
      '5 matches: 40% of prize pool + any jackpot rollover',
      '4 matches: 35% of prize pool (split between winners)',
      '3 matches: 25% of prize pool (split between winners)',
      'No 5-match winner? The jackpot rolls over to next month!',
    ],
    color: 'border-primary/20 bg-primary/5',
    iconBg: 'bg-primary/15',
  },
  {
    number: '05',
    icon: <Shield size={32} className="text-accent" />,
    title: 'Verify & Claim',
    description: 'Winners upload a screenshot as proof. Our admin team reviews and approves. Payment is processed once verified.',
    details: [
      'Upload a screenshot of your golf scorecard',
      'Admin reviews within 48 hours',
      'Approved winners receive payment within 5 business days',
      'Track your prize status in real-time',
    ],
    color: 'border-accent/20 bg-accent/5',
    iconBg: 'bg-accent/15',
  },
  {
    number: '06',
    icon: <Heart size={32} className="text-primary-400" />,
    title: 'Charity Always Wins',
    description: 'Whether you win or not, your chosen charity receives at least 10% of your subscription every month. You can also make independent one-time donations.',
    details: [
      'Choose from our verified charity partners at signup',
      'Change your charity anytime from your dashboard',
      'Increase your contribution percentage (min 10%)',
      'Make one-off donations independent of your subscription',
    ],
    color: 'border-primary/20 bg-primary/5',
    iconBg: 'bg-primary/15',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <div className="py-20 px-4 text-center bg-gradient-to-b from-primary/10 to-transparent">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-label mb-3">Complete Guide</p>
          <h1 className="text-5xl font-black text-text-primary mb-4">
            How <span className="gradient-text">GolfGive</span> Works
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            A complete walkthrough of the platform — from subscribing to winning,
            and every step in between.
          </p>
        </motion.div>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className={`glass-card p-7 border ${step.color} flex flex-col md:flex-row gap-6`}
            >
              <div className="flex items-start gap-4 md:w-1/2">
                <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center shrink-0`}>
                  {step.icon}
                </div>
                <div>
                  <div className="text-5xl font-black text-border/20 -mt-2 mb-1">{step.number}</div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{step.description}</p>
                </div>
              </div>
              <div className="md:w-1/2">
                <ul className="space-y-2.5">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="text-accent mt-0.5">●</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="text-3xl font-black text-text-primary mb-8 text-center">
            Common <span className="gradient-text">Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do I need to win to make a difference?',
                a: 'No! Whether you win or not, your subscription always funds your chosen charity. At least 10% of every payment goes directly to your charity.',
              },
              {
                q: 'What is a Stableford score?',
                a: 'Stableford is a golf scoring system where points are awarded based on your performance at each hole relative to par. Scores typically range from 20–40, but our system accepts 1–45.',
              },
              {
                q: 'What happens if no one matches all 5 numbers?',
                a: "The 5-match jackpot rolls over to the next month's draw, making it even bigger! This keeps growing until someone hits the jackpot.",
              },
              {
                q: 'How do I claim my prize?',
                a: 'If you win, you\'ll receive an email notification. Log into your dashboard, go to "My Winnings", and upload a screenshot as proof. Admin will verify and process payment within 5 business days.',
              },
              {
                q: 'Can I change my charity?',
                a: 'Yes! You can change your charity at any time from your dashboard. The change takes effect for your next subscription payment.',
              },
            ].map((faq, i) => (
              <div key={i} className="glass-card p-5">
                <h4 className="font-semibold text-text-primary mb-2 flex items-start gap-2">
                  <span className="text-accent mt-0.5">Q:</span>
                  {faq.q}
                </h4>
                <p className="text-text-secondary text-sm leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <h2 className="text-3xl font-black text-text-primary mb-4">Ready to Play?</h2>
          <p className="text-text-secondary mb-6">Join 2,847 members already playing, giving, and winning.</p>
          <Link to="/signup" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
            Get Started Today
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
