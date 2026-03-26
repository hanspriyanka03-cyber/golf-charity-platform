import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { planType, userId, email } = req.body

  if (!planType || !userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const origin = req.headers.origin || process.env.VITE_APP_URL || 'http://localhost:5173'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: planType === 'monthly' ? 'GolfGive Monthly' : 'GolfGive Yearly',
              description:
                planType === 'monthly'
                  ? 'Monthly draws • Score tracking • Charity giving'
                  : 'Yearly draws • Score tracking • Charity giving (save 17%)',
            },
            recurring: {
              interval: planType === 'monthly' ? 'month' : 'year',
            },
            unit_amount: planType === 'monthly' ? 999 : 9999, // £9.99 / £99.99
          },
          quantity: 1,
        },
      ],
      metadata: { userId, planType },
      success_url: `${origin}/dashboard?subscribed=true&session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: `${origin}/dashboard/settings`,
    })

    res.json({ checkout_url: session.url, session_id: session.id })
  } catch (err: any) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
}
