# GolfGive — Golf Charity Subscription Platform

> Play. Give. Win. — A subscription platform where golfers enter their Stableford scores into monthly draws while funding their chosen charities.

## Overview

GolfGive is a full-stack web platform that allows golf enthusiasts to:
- Subscribe monthly or yearly
- Enter up to 5 Stableford scores (1–45) per month
- Participate in monthly prize draws (match 3/4/5 numbers to win)
- Fund their chosen charity (minimum 10% of subscription)
- Win cash prizes from a community prize pool

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.11+), Pydantic v2 |
| Database | Supabase (PostgreSQL) + Row Level Security |
| Auth | JWT (python-jose), Passlib (bcrypt) |
| Payments | Stripe (subscriptions + webhooks) |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| State | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Deployment | Railway/Render (backend), Vercel (frontend) |

## Project Structure

```
task_digital_heroes/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py          # Application entry point
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # Supabase client
│   │   ├── models/          # Pydantic models
│   │   ├── routers/         # API route handlers
│   │   ├── schemas/         # Request/response schemas
│   │   ├── services/        # Business logic
│   │   │   ├── draw_engine.py    # Core draw algorithm
│   │   │   ├── prize_pool.py     # Prize calculations
│   │   │   ├── stripe_service.py # Stripe integration
│   │   │   └── email_service.py  # Email notifications
│   │   └── middleware/      # Auth middleware
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── App.tsx          # Routes + auth guards
│   │   ├── types/index.ts   # TypeScript interfaces
│   │   ├── lib/             # API client, auth utils
│   │   ├── hooks/           # React Query hooks
│   │   ├── components/      # Reusable UI components
│   │   └── pages/           # Route pages
│   ├── tailwind.config.ts
│   └── vite.config.ts
└── supabase/
    └── schema.sql           # Full database schema + seed data
```

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Supabase project
- A Stripe account

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your actual values

# Run development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Auth
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:5173

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASSWORD=your-app-password
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the contents of `supabase/schema.sql`
4. Copy your project URL, anon key, and service role key to `backend/.env`

To set up admin test user password:
```python
# Run this in Python to generate bcrypt hash
from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"]).hash("admin123")
print(pwd)
# Then run in Supabase SQL: UPDATE profiles SET password_hash = '<hash>' WHERE email = 'admin@golf.com';
```

## Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two recurring prices in your Stripe dashboard:
   - Monthly: £9.99/month
   - Yearly: £99.99/year
3. Copy the price IDs to your `.env`
4. Set up a webhook endpoint pointing to `/api/v1/subscription/webhook`
5. Add these webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@golf.com | admin123 |
| Test User | test@golf.com | test123 |

## API Overview

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, get JWT |
| GET | `/auth/me` | Current user info |
| GET | `/scores` | Get user's scores |
| POST | `/scores` | Add score (rolling 5) |
| GET | `/subscription` | Current subscription |
| POST | `/subscription/checkout` | Create Stripe checkout |
| GET | `/charities` | List charities |
| GET | `/draws` | Published draws |
| GET | `/draws/my-results` | User's draw history |
| GET | `/winners/me` | User's winnings |
| POST | `/winners/{id}/upload-proof` | Upload win proof |
| GET | `/admin/reports` | Platform analytics |
| POST | `/admin/draws` | Create draw |
| POST | `/admin/draws/{id}/simulate` | Simulate draw |
| POST | `/admin/draws/{id}/publish` | Publish draw + notify |
| PUT | `/admin/winners/{id}/verify` | Approve/reject winner |

## Draw Engine

The draw engine (`backend/app/services/draw_engine.py`) supports two modes:

**Random Draw** — Equal probability for all numbers 1–45.

**Algorithmic Draw** — Weighted by community score frequency:
- `mode='inverse'`: Numbers with *lower* frequency have *higher* chance of being drawn
  (fewer community players scored that number → harder to match → bigger excitement)
- `mode='frequency'`: Numbers with *higher* frequency have *higher* chance
  (most common scores → more winners per draw)

## Prize Distribution

| Match | Pool % | Notes |
|-------|--------|-------|
| 5 numbers | 40% | + jackpot rollover from previous month |
| 4 numbers | 35% | Split equally among winners |
| 3 numbers | 25% | Split equally among winners |

If no 5-match winner, the 40% rolls over and accumulates until won.

## Deployment

### Backend — Railway / Render

1. Connect your GitHub repo
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables from `.env.example`

Or use Docker:
```bash
docker build -t golfgive-backend ./backend
docker run -p 8000:8000 --env-file ./backend/.env golfgive-backend
```

### Frontend — Vercel

1. Connect your GitHub repo
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables: `VITE_API_URL` pointing to your deployed backend

## Architecture Notes

- **JWT Auth**: Stateless. Token stored in localStorage. Decoded on frontend to check expiry.
- **Rolling Scores**: Backend enforces max 5 scores. When adding a 6th, oldest is deleted first.
- **Stripe Webhooks**: Handle subscription lifecycle (created → active → cancelled/lapsed).
- **RLS**: Supabase Row Level Security is enabled but backend uses service key (bypasses RLS for admin operations).
- **Proof Upload**: Currently saves to `/tmp/proofs/`. Production should use Supabase Storage or S3.

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request
