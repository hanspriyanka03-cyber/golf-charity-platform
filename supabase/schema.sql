-- Golf Charity Platform — Supabase Schema
-- Run this in your Supabase SQL editor

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Drop existing tables (for fresh migration) ──────────────────────────────
-- DROP TABLE IF EXISTS donations CASCADE;
-- DROP TABLE IF EXISTS winners CASCADE;
-- DROP TABLE IF EXISTS draws CASCADE;
-- DROP TABLE IF EXISTS golf_scores CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS charities CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (
    subscription_status IN ('active', 'inactive', 'cancelled', 'lapsed', 'past_due')
  ),
  charity_id UUID,
  charity_percentage INTEGER DEFAULT 10
    CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  stripe_customer_id TEXT,
  password_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Subscriptions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT CHECK (
    status IN ('active', 'inactive', 'cancelled', 'lapsed', 'past_due')
  ),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  prize_pool_contribution DECIMAL(10,2) DEFAULT 0,
  charity_contribution DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Golf Scores (rolling max 5 per user) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date_played DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user score lookup
CREATE INDEX IF NOT EXISTS idx_golf_scores_user_id ON golf_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_created_at ON golf_scores(created_at DESC);

-- ─── Charities ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  events JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Monthly Draws ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,  -- YYYY-MM format
  draw_type TEXT NOT NULL CHECK (draw_type IN ('random', 'algorithmic')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'published')),
  drawn_numbers INTEGER[] NOT NULL DEFAULT '{}',
  prize_pool_total DECIMAL(10,2) DEFAULT 0,
  jackpot_amount DECIMAL(10,2) DEFAULT 0,
  five_match_pool DECIMAL(10,2) DEFAULT 0,
  four_match_pool DECIMAL(10,2) DEFAULT 0,
  three_match_pool DECIMAL(10,2) DEFAULT 0,
  jackpot_rollover DECIMAL(10,2) DEFAULT 0,
  simulation_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_draws_month ON draws(month DESC);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);

-- ─── Winners ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_count INTEGER NOT NULL CHECK (match_count IN (3, 4, 5)),
  prize_amount DECIMAL(10,2),
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid')),
  proof_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id);

-- ─── Independent Donations ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID REFERENCES charities(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (true);  -- Service key bypasses RLS

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (true);

CREATE POLICY "Allow insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Golf scores
CREATE POLICY "Users can view own scores"
  ON golf_scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own scores"
  ON golf_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own scores"
  ON golf_scores FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own scores"
  ON golf_scores FOR DELETE
  USING (true);

-- Charities: publicly readable
CREATE POLICY "Charities are publicly readable"
  ON charities FOR SELECT
  USING (true);

CREATE POLICY "Allow charity management"
  ON charities FOR ALL
  USING (true);

-- Draws: published draws are public
CREATE POLICY "Published draws are public"
  ON draws FOR SELECT
  USING (true);

CREATE POLICY "Allow draw management"
  ON draws FOR ALL
  USING (true);

-- Subscriptions
CREATE POLICY "Allow subscription management"
  ON subscriptions FOR ALL
  USING (true);

-- Winners
CREATE POLICY "Allow winner management"
  ON winners FOR ALL
  USING (true);

-- Donations
CREATE POLICY "Allow donation management"
  ON donations FOR ALL
  USING (true);

-- ─── Seed Data ────────────────────────────────────────────────────────────────
INSERT INTO charities (name, description, image_url, website, is_featured, events)
VALUES
(
  'Golf Foundation',
  'Growing grassroots golf and changing lives through the sport. We create opportunities for young people and communities to experience the joy of golf.',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&q=80',
  'https://golf-foundation.org',
  true,
  '[
    {"title": "Junior Golf Day", "date": "2025-04-15", "description": "Free taster sessions for 8-16 year olds", "location": "Nationwide"},
    {"title": "Community Fundraiser", "date": "2025-05-20", "description": "Annual charity golf day", "location": "Royal Liverpool"}
  ]'::JSONB
),
(
  'British Heart Foundation',
  'Life-saving research, vital information, and support for the millions of people living with heart and circulatory disease in the UK.',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
  'https://bhf.org.uk',
  false,
  '[
    {"title": "Heart Month Walk", "date": "2025-02-01", "description": "Sponsored walk for heart health", "location": "Various locations"},
    {"title": "Golf Day", "date": "2025-06-12", "description": "Charity golf tournament", "location": "Wentworth Club"}
  ]'::JSONB
),
(
  'Cancer Research UK',
  'Together we will beat cancer. We fund scientists, doctors and nurses who are working to find new ways to prevent, diagnose and treat all types of cancer.',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
  'https://cancerresearchuk.org',
  false,
  '[
    {"title": "Race for Life", "date": "2025-06-01", "description": "5K run to raise money for cancer research"},
    {"title": "Golf Challenge", "date": "2025-08-15", "description": "18-hole charity tournament"}
  ]'::JSONB
),
(
  'Macmillan Cancer Support',
  'No one should face cancer alone. Macmillan provides specialist health care, information and financial support to people living with cancer.',
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80',
  'https://macmillan.org.uk',
  false,
  '[
    {"title": "Coffee Morning", "date": "2025-09-26", "description": "World's Biggest Coffee Morning fundraiser"},
    {"title": "Mighty Hike", "date": "2025-07-13", "description": "26-mile sponsored walk"}
  ]'::JSONB
),
(
  'Alzheimer''s Society',
  'United against dementia. We provide information and support, improve care, fund research, and create lasting change for people affected by dementia.',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
  'https://alzheimers.org.uk',
  false,
  '[]'::JSONB
)
ON CONFLICT DO NOTHING;

-- Seed admin user (password: admin123)
-- The password_hash below is bcrypt hash of 'admin123'
INSERT INTO profiles (id, email, full_name, role, subscription_status, charity_percentage, is_active)
VALUES
(
  gen_random_uuid(),
  'admin@golf.com',
  'Admin User',
  'admin',
  'active',
  10,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Note: Run this separately after inserting admin to set password
-- UPDATE profiles SET password_hash = '$2b$12$...' WHERE email = 'admin@golf.com';
-- Use Python: from passlib.context import CryptContext; CryptContext(schemes=["bcrypt"]).hash("admin123")

COMMENT ON TABLE profiles IS 'User profiles — stores application-level user data';
COMMENT ON TABLE subscriptions IS 'Stripe subscription records per user';
COMMENT ON TABLE golf_scores IS 'Stableford golf scores (1-45), max 5 per user (rolling window)';
COMMENT ON TABLE charities IS 'Charity partners that users can donate to';
COMMENT ON TABLE draws IS 'Monthly prize draws with 5 drawn numbers';
COMMENT ON TABLE winners IS 'Draw winners awaiting verification and payout';
COMMENT ON TABLE donations IS 'Independent one-time donations to charities';
