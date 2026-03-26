-- ============================================================
-- GolfGive Platform — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.charities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'lapsed')),
  charity_id UUID REFERENCES public.charities(id),
  charity_percentage INTEGER DEFAULT 10,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date_played DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT,
  plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'lapsed', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  prize_pool_contribution DECIMAL(10,2) DEFAULT 0,
  charity_contribution DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.draws (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  draw_type TEXT DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'published')),
  drawn_numbers INTEGER[] DEFAULT '{}',
  prize_pool_total DECIMAL(10,2) DEFAULT 0,
  jackpot_amount DECIMAL(10,2) DEFAULT 0,
  five_match_pool DECIMAL(10,2) DEFAULT 0,
  four_match_pool DECIMAL(10,2) DEFAULT 0,
  three_match_pool DECIMAL(10,2) DEFAULT 0,
  jackpot_rollover DECIMAL(10,2) DEFAULT 0,
  simulation_results JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  scores_used INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_count INTEGER CHECK (match_count IN (3, 4, 5)),
  prize_amount DECIMAL(10,2),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  proof_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRIGGER: Auto-create profile on signup ──────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── TRIGGER: Enforce max 5 scores per user ──────────────────

CREATE OR REPLACE FUNCTION public.enforce_score_limit()
RETURNS TRIGGER AS $$
DECLARE
  score_count INTEGER;
  oldest_id UUID;
BEGIN
  SELECT COUNT(*) INTO score_count
  FROM public.scores WHERE user_id = NEW.user_id;

  IF score_count >= 5 THEN
    SELECT id INTO oldest_id
    FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY date_played ASC, created_at ASC
    LIMIT 1;

    DELETE FROM public.scores WHERE id = oldest_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_score_insert ON public.scores;
CREATE TRIGGER before_score_insert
  BEFORE INSERT ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_score_limit();

-- ─── HELPER: Admin check (SECURITY DEFINER bypasses RLS) ─────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "scores_select" ON public.scores;
DROP POLICY IF EXISTS "scores_insert" ON public.scores;
DROP POLICY IF EXISTS "scores_update" ON public.scores;
DROP POLICY IF EXISTS "scores_delete" ON public.scores;
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_all" ON public.subscriptions;
DROP POLICY IF EXISTS "charities_select" ON public.charities;
DROP POLICY IF EXISTS "charities_admin" ON public.charities;
DROP POLICY IF EXISTS "draws_select" ON public.draws;
DROP POLICY IF EXISTS "draws_admin" ON public.draws;
DROP POLICY IF EXISTS "draw_entries_select" ON public.draw_entries;
DROP POLICY IF EXISTS "draw_entries_admin" ON public.draw_entries;
DROP POLICY IF EXISTS "winners_select" ON public.winners;
DROP POLICY IF EXISTS "winners_update_proof" ON public.winners;
DROP POLICY IF EXISTS "winners_admin" ON public.winners;

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Scores
CREATE POLICY "scores_select" ON public.scores
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "scores_insert" ON public.scores
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "scores_update" ON public.scores
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "scores_delete" ON public.scores
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Subscriptions
CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "subscriptions_all" ON public.subscriptions
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Charities (public read, admin write)
CREATE POLICY "charities_select" ON public.charities
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "charities_admin" ON public.charities
  FOR ALL USING (public.is_admin());

-- Draws (published are public, admins see all)
CREATE POLICY "draws_select" ON public.draws
  FOR SELECT USING (status = 'published' OR public.is_admin());

CREATE POLICY "draws_admin" ON public.draws
  FOR ALL USING (public.is_admin());

-- Draw entries
CREATE POLICY "draw_entries_select" ON public.draw_entries
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "draw_entries_admin" ON public.draw_entries
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Winners
CREATE POLICY "winners_select" ON public.winners
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "winners_update_proof" ON public.winners
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "winners_admin" ON public.winners
  FOR ALL USING (public.is_admin());

-- ─── STORAGE: Winner proof uploads ───────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('winner-proofs', 'winner-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload proof" ON storage.objects;

CREATE POLICY "Anyone can view proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'winner-proofs');

CREATE POLICY "Users can upload proof" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'winner-proofs' AND auth.uid() IS NOT NULL);

-- ─── SEED DATA: Sample charities ─────────────────────────────

INSERT INTO public.charities (name, description, image_url, website, is_featured, is_active, events) VALUES
(
  'Golf Foundation',
  'The Golf Foundation transforms the lives of young people through golf, helping them develop confidence, resilience and life skills. We support over 100,000 young people across the UK each year.',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&q=80',
  'https://www.golf-foundation.org',
  true,
  true,
  '[{"title": "Junior Golf Day", "date": "2026-04-12", "description": "Annual junior golf day raising funds for underprivileged youth", "location": "St Andrews, Scotland"}]'
),
(
  'Macmillan Cancer Support',
  'We provide specialist health care, information and financial support to people affected by cancer. Whatever cancer throws your way, we''re right there with you.',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
  'https://www.macmillan.org.uk',
  true,
  true,
  '[{"title": "Charity Golf Classic", "date": "2026-05-20", "description": "Annual charity golf tournament supporting cancer patients", "location": "Royal Birkdale, Southport"}]'
),
(
  'Help for Heroes',
  'We provide recovery services and support to wounded, injured and sick veterans and their families. Every penny raised goes directly to helping those who served.',
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&q=80',
  'https://www.helpforheroes.org.uk',
  false,
  true,
  '[{"title": "Veterans Golf Day", "date": "2026-06-08", "description": "Golf day supporting wounded veterans and their families", "location": "Wentworth Club, Surrey"}]'
),
(
  'British Heart Foundation',
  'Fighting for every heartbeat. We fund lifesaving research and provide vital support for people living with heart and circulatory diseases.',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&q=80',
  'https://www.bhf.org.uk',
  false,
  true,
  '[]'
),
(
  'RNLI',
  'The Royal National Lifeboat Institution saves lives at sea. Our volunteer crews are on call 24/7, 365 days a year — whatever the weather.',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
  'https://rnli.org',
  true,
  true,
  '[{"title": "Coastal Golf Challenge", "date": "2026-07-15", "description": "Golf along the coast raising money for sea rescue", "location": "Royal Troon, Ayrshire"}]'
),
(
  'Age UK',
  'We believe in a world where older people flourish. We provide services and support to 1.4 million people each year, tackling loneliness and ensuring everyone can love later life.',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
  'https://www.ageuk.org.uk',
  false,
  true,
  '[]'
)
ON CONFLICT DO NOTHING;

-- ─── ADMIN USER: Create via Supabase Dashboard ────────────────
-- After running this schema:
-- 1. Go to Authentication → Users → Add user
-- 2. Create: admin@golf.com / Admin123!
-- 3. Then run this to give admin role (replace <USER_ID>):
--
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@golf.com';
--
-- Or use the helper below after creating the user in Dashboard.
