export interface User {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin'
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
  charity_id: string | null
  charity_percentage: number
  is_active: boolean
  created_at: string | null
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  plan_type: 'monthly' | 'yearly'
  status: 'active' | 'inactive' | 'cancelled' | 'lapsed' | 'past_due'
  current_period_start: string | null
  current_period_end: string | null
  prize_pool_contribution: number | null
  charity_contribution: number | null
  created_at: string | null
}

export interface Score {
  id: string
  user_id: string
  score: number
  date_played: string
  created_at: string | null
}

export interface Charity {
  id: string
  name: string
  description: string | null
  image_url: string | null
  website: string | null
  is_featured: boolean
  is_active: boolean
  events: CharityEvent[]
  created_at: string | null
}

export interface CharityEvent {
  id?: string
  title: string
  date: string
  description?: string
  location?: string
}

export interface Draw {
  id: string
  month: string
  draw_type: 'random' | 'algorithmic'
  status: 'draft' | 'simulated' | 'published'
  drawn_numbers: number[]
  prize_pool_total: number
  jackpot_amount: number
  five_match_pool: number
  four_match_pool: number
  three_match_pool: number
  jackpot_rollover: number
  simulation_results: SimulationResult | null
  created_at: string | null
  published_at: string | null
}

export interface SimulationResult {
  drawn_numbers: number[]
  winners: {
    '5_match': string[]
    '4_match': string[]
    '3_match': string[]
  }
  prize_breakdown: PrizeBreakdown
  total_participants: number
  total_winners: number
}

export interface PrizeBreakdown {
  five_match_pool: number
  four_match_pool: number
  three_match_pool: number
  prize_per_5_winner: number
  prize_per_4_winner: number
  prize_per_3_winner: number
  jackpot_rollover_to_next: number
  has_jackpot_winner: boolean
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  match_count: 3 | 4 | 5
  prize_amount: number | null
  verification_status: 'pending' | 'approved' | 'rejected'
  payment_status: 'pending' | 'paid'
  proof_url: string | null
  admin_notes: string | null
  created_at: string | null
  draw_month?: string
  user_email?: string
  user_name?: string
}

export interface DrawResult {
  draw: Draw
  winners_5: WinnerSummary[]
  winners_4: WinnerSummary[]
  winners_3: WinnerSummary[]
  total_winners: number
}

export interface WinnerSummary {
  user_id: string
  match_count: number
  prize_amount: number
}

export interface AdminReport {
  total_users: number
  active_subscribers: number
  total_prize_pool: number
  total_charity_contributions: number
  total_independent_donations: number
  draws_count: number
  published_draws: number
  total_prizes_paid: number
  total_winners: number
}

export interface Plan {
  plan_type: string
  price: number
  currency: string
  interval: string
  price_id: string
  description: string
  features: string[]
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface UserDrawResult {
  draw: Draw
  user_scores: number[]
  numbers_matched: number
  is_winner: boolean
  win_details: Winner | null
}
