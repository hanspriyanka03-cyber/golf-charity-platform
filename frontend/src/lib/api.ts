import { supabase } from './supabase'
import type {
  User,
  Score,
  Subscription,
  Charity,
  Draw,
  DrawResult,
  Winner,
  AdminReport,
  Plan,
  UserDrawResult,
} from '../types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function throwError(error: { message: string } | null, message?: string): never {
  throw { response: { data: { detail: error?.message || message || 'An error occurred' } } }
}

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throwError(error, 'Not authenticated')
  return user!
}

async function getProfile(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throwError(error)
  return data as User
}

// ─── Hardcoded plans ──────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    plan_type: 'monthly',
    price: 9.99,
    currency: 'GBP',
    interval: 'month',
    price_id: 'price_monthly',
    description: 'Monthly subscription',
    features: [
      'Enter monthly prize draw',
      'Track up to 5 Stableford scores',
      'Support your chosen charity (min 10%)',
      '£7 goes to the prize pool each month',
    ],
  },
  {
    plan_type: 'yearly',
    price: 99.99,
    currency: 'GBP',
    interval: 'year',
    price_id: 'price_yearly',
    description: 'Yearly subscription (save 17%)',
    features: [
      'Everything in Monthly',
      'Save £19.89 vs monthly billing',
      '12 draws guaranteed',
      'Priority winner verification',
    ],
  },
]

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (data: {
    email: string
    password: string
    full_name: string
    charity_id?: string
    charity_percentage?: number
  }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
      },
    })
    if (error) throwError(error)
    if (!authData.user) throwError(null, 'Registration failed')

    // Update charity if selected (profile is created by trigger)
    if (data.charity_id) {
      await supabase
        .from('profiles')
        .update({
          charity_id: data.charity_id,
          charity_percentage: data.charity_percentage || 10,
        })
        .eq('id', authData.user!.id)
    }

    const profile = await getProfile(authData.user!.id)
    return {
      data: {
        access_token: authData.session?.access_token || '',
        token_type: 'bearer',
        user: profile,
      },
    }
  },

  login: async (email: string, password: string) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throwError(error)

    const profile = await getProfile(authData.user!.id)
    return {
      data: {
        access_token: authData.session?.access_token || '',
        token_type: 'bearer',
        user: profile,
      },
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    return { data: { message: 'Logged out' } }
  },

  me: async () => {
    const user = await getCurrentUser()
    const profile = await getProfile(user.id)
    return { data: profile }
  },

  changePassword: async (_currentPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throwError(error)
    return { data: { message: 'Password updated successfully' } }
  },
}

// ─── Scores ────────────────────────────────────────────────────────────────────

export const scoresApi = {
  getScores: async (): Promise<{ data: { scores: Score[]; total: number } }> => {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('date_played', { ascending: false })
    if (error) throwError(error)
    const scores = data as Score[]
    return { data: { scores, total: scores.length } }
  },

  addScore: async (score: number, datePlayed: string) => {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('scores')
      .insert({ user_id: user.id, score, date_played: datePlayed })
      .select()
      .single()
    if (error) throwError(error)
    return { data: data as Score }
  },

  updateScore: async (id: string, score?: number, datePlayed?: string) => {
    const updates: Record<string, unknown> = {}
    if (score !== undefined) updates.score = score
    if (datePlayed) updates.date_played = datePlayed

    const { data, error } = await supabase
      .from('scores')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throwError(error)
    return { data: data as Score }
  },

  deleteScore: async (id: string) => {
    const { error } = await supabase.from('scores').delete().eq('id', id)
    if (error) throwError(error)
    return { data: undefined }
  },
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptionApi = {
  getPlans: async () => ({ data: PLANS }),

  getSubscription: async (): Promise<{ data: Subscription | null }> => {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throwError(error)
    return { data: data as Subscription | null }
  },

  createCheckout: async (planType: 'monthly' | 'yearly') => {
    const user = await getCurrentUser()

    // Try real Stripe checkout first
    try {
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, userId: user.id, email: user.email }),
      })
      if (res.ok) {
        const data = await res.json()
        return { data: { checkout_url: data.checkout_url, session_id: data.session_id } }
      }
    } catch {
      // Fall through to demo mode
    }

    // Demo mode fallback (local dev without API routes)
    await subscriptionApi.activateSubscription(planType)
    return { data: { checkout_url: '/dashboard?subscribed=true&session_id=demo', session_id: 'demo' } }
  },

  activateSubscription: async (
    planType: 'monthly' | 'yearly',
    stripeSubscriptionId?: string,
    stripeCustomerId?: string,
  ) => {
    const user = await getCurrentUser()
    const price = planType === 'monthly' ? 9.99 : 99.99
    const prizePoolContribution = +(price * 0.70).toFixed(2)
    const charityContribution = +(price * 0.15).toFixed(2)

    const now = new Date()
    const periodEnd = new Date(now)
    if (planType === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: user.id,
          plan_type: planType,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          prize_pool_contribution: prizePoolContribution,
          charity_contribution: charityContribution,
          ...(stripeSubscriptionId && { stripe_subscription_id: stripeSubscriptionId }),
        },
        { onConflict: 'user_id' }
      )
    if (error) throwError(error)

    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
        ...(stripeSubscriptionId && { stripe_subscription_id: stripeSubscriptionId }),
      })
      .eq('id', user.id)
  },

  cancelSubscription: async () => {
    const user = await getCurrentUser()

    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)

    await supabase
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', user.id)

    return { data: { message: 'Subscription cancelled' } }
  },
}

// ─── Charities ─────────────────────────────────────────────────────────────────

export const charitiesApi = {
  listCharities: async (search?: string, featured?: boolean) => {
    let query = supabase.from('charities').select('*')
    if (search) query = query.ilike('name', `%${search}%`)
    if (featured !== undefined) query = query.eq('is_featured', featured)
    query = query.order('is_featured', { ascending: false }).order('name')

    const { data, error } = await query
    if (error) console.error('[charitiesApi.listCharities] error:', error)
    return { data: (data || []) as Charity[] }
  },

  getCharity: async (id: string) => {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throwError(error)
    return { data: data as Charity }
  },

  donate: async (charityId: string, amount: number) => {
    const { data: charity } = await supabase
      .from('charities')
      .select('name')
      .eq('id', charityId)
      .single()
    // In production: create Stripe payment intent via Edge Function
    return {
      data: {
        client_secret: 'demo_client_secret',
        payment_intent_id: `demo_pi_${Date.now()}`,
        amount,
        charity_name: charity?.name || 'charity',
      },
    }
  },

  updateMyCharity: async (charityId: string, charityPercentage: number) => {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('profiles')
      .update({ charity_id: charityId, charity_percentage: charityPercentage })
      .eq('id', user.id)
      .select()
      .single()
    if (error) throwError(error)
    return { data: data as User }
  },
}

// ─── Draws ─────────────────────────────────────────────────────────────────────

export const drawsApi = {
  listDraws: async () => {
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) throwError(error)
    return { data: data as Draw[] }
  },

  getDraw: async (id: string) => {
    const { data: draw, error } = await supabase
      .from('draws')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throwError(error)

    const { data: winners } = await supabase
      .from('winners')
      .select('*')
      .eq('draw_id', id)

    const w = winners || []
    const result: DrawResult = {
      draw: draw as Draw,
      winners_5: w.filter(x => x.match_count === 5).map(x => ({ user_id: x.user_id, match_count: 5, prize_amount: x.prize_amount })),
      winners_4: w.filter(x => x.match_count === 4).map(x => ({ user_id: x.user_id, match_count: 4, prize_amount: x.prize_amount })),
      winners_3: w.filter(x => x.match_count === 3).map(x => ({ user_id: x.user_id, match_count: 3, prize_amount: x.prize_amount })),
      total_winners: w.length,
    }
    return { data: result }
  },

  myResults: async (): Promise<{ data: UserDrawResult[] }> => {
    const user = await getCurrentUser()

    const { data: draws, error: drawsError } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (drawsError) throwError(drawsError)

    const { data: myEntries } = await supabase
      .from('draw_entries')
      .select('*')
      .eq('user_id', user.id)

    const { data: myWins } = await supabase
      .from('winners')
      .select('*')
      .eq('user_id', user.id)

    const results: UserDrawResult[] = (draws || []).map(draw => {
      const entry = myEntries?.find(e => e.draw_id === draw.id)
      const win = myWins?.find(w => w.draw_id === draw.id) || null
      const userScores = entry?.scores_used || []
      const drawnNumbers: number[] = draw.drawn_numbers || []
      const numbersMatched = userScores.filter((s: number) => drawnNumbers.includes(s)).length

      return {
        draw: draw as Draw,
        user_scores: userScores,
        numbers_matched: numbersMatched,
        is_winner: !!win,
        win_details: win as Winner | null,
      }
    })

    return { data: results }
  },
}

// ─── Winners ───────────────────────────────────────────────────────────────────

export const winnersApi = {
  myWinnings: async () => {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('winners')
      .select(`*, draws(month)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throwError(error)

    const winners = (data || []).map(w => ({
      ...w,
      draw_month: w.draws?.month,
    })) as Winner[]
    return { data: winners }
  },

  getWinner: async (id: string) => {
    const { data, error } = await supabase
      .from('winners')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throwError(error)
    return { data: data as Winner }
  },

  uploadProof: async (winnerId: string, file: File) => {
    const user = await getCurrentUser()
    const ext = file.name.split('.').pop()
    const fileName = `${user.id}/${winnerId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(fileName, file, { upsert: true })
    if (uploadError) throwError(uploadError)

    const { data: { publicUrl } } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(fileName)

    await supabase.from('winners').update({ proof_url: publicUrl }).eq('id', winnerId)

    return { data: { proof_url: publicUrl, message: 'Proof uploaded successfully' } }
  },
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  // ── Users ──

  listUsers: async (params?: { search?: string; subscription_status?: string }) => {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (params?.search) {
      query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
    }
    if (params?.subscription_status) {
      query = query.eq('subscription_status', params.subscription_status)
    }

    const { data, error } = await query
    if (error) throwError(error)
    return { data: data as User[] }
  },

  getUser: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throwError(error)
    return { data: data as User }
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    const allowed: Record<string, unknown> = {}
    if (updates.role !== undefined) allowed.role = updates.role
    if (updates.subscription_status !== undefined) allowed.subscription_status = updates.subscription_status
    if (updates.is_active !== undefined) allowed.is_active = updates.is_active
    if (updates.charity_id !== undefined) allowed.charity_id = updates.charity_id
    if (updates.charity_percentage !== undefined) allowed.charity_percentage = updates.charity_percentage

    const { data, error } = await supabase
      .from('profiles')
      .update(allowed)
      .eq('id', id)
      .select()
      .single()
    if (error) throwError(error)
    return { data: data as User }
  },

  updateUserScores: async (userId: string, scores: { score: number; date_played: string }[]) => {
    await supabase.from('scores').delete().eq('user_id', userId)
    if (scores.length > 0) {
      const inserts = scores.slice(0, 5).map(s => ({ user_id: userId, score: s.score, date_played: s.date_played }))
      const { error } = await supabase.from('scores').insert(inserts)
      if (error) throwError(error)
    }
    return { data: { message: 'Scores updated' } }
  },

  listSubscriptions: async () => {
    const { data, error } = await supabase.from('subscriptions').select('*')
    if (error) throwError(error)
    return { data: data as Subscription[] }
  },

  // ── Draws ──

  listAdminDraws: async (params?: { status?: string }) => {
    let query = supabase.from('draws').select('*').order('created_at', { ascending: false })
    if (params?.status) query = query.eq('status', params.status)
    const { data, error } = await query
    if (error) throwError(error)
    return { data: data as Draw[] }
  },

  createDraw: async (month: string, drawType: 'random' | 'algorithmic') => {
    // Calculate prize pool from active subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('prize_pool_contribution')
      .eq('status', 'active')

    const prizePoolTotal = (subs || []).reduce((sum, s) => sum + (s.prize_pool_contribution || 0), 0)
    const jackpotAmount = +(prizePoolTotal * 0.40).toFixed(2)
    const fiveMatchPool = jackpotAmount
    const fourMatchPool = +(prizePoolTotal * 0.35).toFixed(2)
    const threeMatchPool = +(prizePoolTotal * 0.25).toFixed(2)

    const { data, error } = await supabase
      .from('draws')
      .insert({
        month,
        draw_type: drawType,
        status: 'draft',
        prize_pool_total: prizePoolTotal,
        jackpot_amount: jackpotAmount,
        five_match_pool: fiveMatchPool,
        four_match_pool: fourMatchPool,
        three_match_pool: threeMatchPool,
      })
      .select()
      .single()
    if (error) throwError(error)
    return { data: data as Draw }
  },

  simulateDraw: async (drawId: string) => {
    // Get draw
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single()
    if (drawError) throwError(drawError)

    // Get active subscribers with their scores
    const { data: subscribers } = await supabase
      .from('profiles')
      .select('id, scores(score, date_played)')
      .eq('subscription_status', 'active')

    const activeSubscribers = (subscribers || []).filter(s => (s.scores as Score[]).length > 0)

    // Generate winning numbers
    let drawnNumbers: number[]
    if (draw.draw_type === 'algorithmic') {
      // Weighted inverse frequency — less common scores are more likely to be drawn
      const allScores = activeSubscribers.flatMap(s => (s.scores as Score[]).map(sc => sc.score))
      const frequency: Record<number, number> = {}
      for (const s of allScores) frequency[s] = (frequency[s] || 0) + 1

      const pool: number[] = []
      for (let i = 1; i <= 45; i++) {
        const freq = frequency[i] || 0
        const weight = Math.max(1, 12 - freq)
        for (let j = 0; j < weight; j++) pool.push(i)
      }
      drawnNumbers = []
      while (drawnNumbers.length < 5) {
        const idx = Math.floor(Math.random() * pool.length)
        const num = pool[idx]
        if (!drawnNumbers.includes(num)) drawnNumbers.push(num)
      }
    } else {
      const available = Array.from({ length: 45 }, (_, i) => i + 1)
      drawnNumbers = []
      while (drawnNumbers.length < 5) {
        const idx = Math.floor(Math.random() * available.length)
        drawnNumbers.push(available.splice(idx, 1)[0])
      }
    }
    drawnNumbers.sort((a, b) => a - b)

    // Find winners
    const matches5: string[] = []
    const matches4: string[] = []
    const matches3: string[] = []

    for (const sub of activeSubscribers) {
      const userScores = (sub.scores as Score[]).map(s => s.score)
      const matchCount = userScores.filter(s => drawnNumbers.includes(s)).length
      if (matchCount >= 5) matches5.push(sub.id)
      else if (matchCount >= 4) matches4.push(sub.id)
      else if (matchCount >= 3) matches3.push(sub.id)
    }

    // Prize breakdown
    const totalPool = Number(draw.prize_pool_total) || 100
    const jackpotPool = +(totalPool * 0.40).toFixed(2)
    const fourMatchPool = +(totalPool * 0.35).toFixed(2)
    const threeMatchPool = +(totalPool * 0.25).toFixed(2)
    const hasJackpot = matches5.length > 0

    const prizeBreakdown = {
      five_match_pool: jackpotPool,
      four_match_pool: fourMatchPool,
      three_match_pool: threeMatchPool,
      prize_per_5_winner: matches5.length > 0 ? +(jackpotPool / matches5.length).toFixed(2) : 0,
      prize_per_4_winner: matches4.length > 0 ? +(fourMatchPool / matches4.length).toFixed(2) : 0,
      prize_per_3_winner: matches3.length > 0 ? +(threeMatchPool / matches3.length).toFixed(2) : 0,
      jackpot_rollover_to_next: hasJackpot ? 0 : jackpotPool,
      has_jackpot_winner: hasJackpot,
    }

    const simulationResults = {
      drawn_numbers: drawnNumbers,
      winners: { '5_match': matches5, '4_match': matches4, '3_match': matches3 },
      prize_breakdown: prizeBreakdown,
      total_participants: activeSubscribers.length,
      total_winners: matches5.length + matches4.length + matches3.length,
    }

    await supabase.from('draws').update({
      drawn_numbers: drawnNumbers,
      status: 'simulated',
      five_match_pool: jackpotPool,
      four_match_pool: fourMatchPool,
      three_match_pool: threeMatchPool,
      jackpot_amount: jackpotPool,
      jackpot_rollover: hasJackpot ? 0 : jackpotPool,
      simulation_results: simulationResults,
    }).eq('id', drawId)

    return { data: simulationResults }
  },

  publishDraw: async (drawId: string) => {
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single()
    if (drawError) throwError(drawError)
    if (!draw.simulation_results) throwError(null, 'Run simulation before publishing')

    const sim = draw.simulation_results as {
      drawn_numbers: number[]
      winners: { '5_match': string[]; '4_match': string[]; '3_match': string[] }
      prize_breakdown: {
        prize_per_5_winner: number
        prize_per_4_winner: number
        prize_per_3_winner: number
      }
    }

    // Snapshot scores for all active subscribers
    const { data: activeSubscribers } = await supabase
      .from('profiles')
      .select('id, scores(score)')
      .eq('subscription_status', 'active')

    const entryInserts = (activeSubscribers || [])
      .filter(s => (s.scores as Score[]).length > 0)
      .map(s => ({
        draw_id: drawId,
        user_id: s.id,
        scores_used: (s.scores as Score[]).map(sc => sc.score),
      }))

    if (entryInserts.length > 0) {
      await supabase.from('draw_entries').upsert(entryInserts, { onConflict: 'draw_id,user_id' })
    }

    // Create winner records
    const winnerInserts: object[] = []
    for (const userId of sim.winners['5_match']) {
      winnerInserts.push({ draw_id: drawId, user_id: userId, match_count: 5, prize_amount: sim.prize_breakdown.prize_per_5_winner })
    }
    for (const userId of sim.winners['4_match']) {
      winnerInserts.push({ draw_id: drawId, user_id: userId, match_count: 4, prize_amount: sim.prize_breakdown.prize_per_4_winner })
    }
    for (const userId of sim.winners['3_match']) {
      winnerInserts.push({ draw_id: drawId, user_id: userId, match_count: 3, prize_amount: sim.prize_breakdown.prize_per_3_winner })
    }
    if (winnerInserts.length > 0) {
      await supabase.from('winners').insert(winnerInserts)
    }

    await supabase.from('draws').update({
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', drawId)

    return { data: { message: 'Draw published', drawn_numbers: sim.drawn_numbers } }
  },

  // ── Charities ──

  createCharity: async (data: Partial<Charity>) => {
    const { data: result, error } = await supabase
      .from('charities')
      .insert({ ...data, events: data.events || [] })
      .select()
      .single()
    if (error) throwError(error)
    return { data: result as Charity }
  },

  updateCharity: async (id: string, data: Partial<Charity>) => {
    const { data: result, error } = await supabase
      .from('charities')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throwError(error)
    return { data: result as Charity }
  },

  deleteCharity: async (id: string) => {
    const { error } = await supabase.from('charities').update({ is_active: false }).eq('id', id)
    if (error) throwError(error)
    return { data: undefined }
  },

  // ── Winners ──

  listWinners: async (params?: { verification_status?: string; payment_status?: string }) => {
    let query = supabase
      .from('winners')
      .select(`*, profiles(full_name, email), draws(month)`)
      .order('created_at', { ascending: false })
    if (params?.verification_status) query = query.eq('verification_status', params.verification_status)
    if (params?.payment_status) query = query.eq('payment_status', params.payment_status)

    const { data, error } = await query
    if (error) throwError(error)

    const winners = (data || []).map(w => ({
      ...w,
      user_name: w.profiles?.full_name,
      user_email: w.profiles?.email,
      draw_month: w.draws?.month,
    })) as Winner[]
    return { data: winners }
  },

  verifyWinner: async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const { error } = await supabase
      .from('winners')
      .update({ verification_status: status, admin_notes: notes || null })
      .eq('id', id)
    if (error) throwError(error)
    return { data: { message: `Winner ${status}` } }
  },

  markPayout: async (id: string) => {
    const { error } = await supabase
      .from('winners')
      .update({ payment_status: 'paid' })
      .eq('id', id)
    if (error) throwError(error)
    return { data: { message: 'Payout marked as complete' } }
  },

  // ── Reports ──

  getReports: async (): Promise<{ data: AdminReport }> => {
    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: activeSubs },
      { count: drawsCount },
      { count: publishedDraws },
      { count: totalWinners },
      { data: paidWinners },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('subscriptions').select('prize_pool_contribution, charity_contribution').eq('status', 'active'),
      supabase.from('draws').select('*', { count: 'exact', head: true }),
      supabase.from('draws').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('winners').select('*', { count: 'exact', head: true }),
      supabase.from('winners').select('prize_amount').eq('payment_status', 'paid'),
    ])

    const totalPrizePool = (activeSubs || []).reduce((s, r) => s + (r.prize_pool_contribution || 0), 0)
    const totalCharityContributions = (activeSubs || []).reduce((s, r) => s + (r.charity_contribution || 0), 0)
    const totalPrizesPaid = (paidWinners || []).reduce((s, r) => s + (r.prize_amount || 0), 0)

    return {
      data: {
        total_users: totalUsers || 0,
        active_subscribers: activeSubscribers || 0,
        total_prize_pool: +totalPrizePool.toFixed(2),
        total_charity_contributions: +totalCharityContributions.toFixed(2),
        total_independent_donations: 0,
        draws_count: drawsCount || 0,
        published_draws: publishedDraws || 0,
        total_prizes_paid: +totalPrizesPaid.toFixed(2),
        total_winners: totalWinners || 0,
      },
    }
  },
}

export default supabase
