import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export default async function handler(req: any, res: any) {
  const { session_id } = req.query

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ valid: false, error: 'Missing session_id' })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status === 'paid' || session.status === 'complete') {
      res.json({
        valid: true,
        userId: session.metadata?.userId,
        planType: session.metadata?.planType,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      })
    } else {
      res.json({ valid: false })
    }
  } catch (err: any) {
    console.error('Verify error:', err)
    res.status(400).json({ valid: false, error: 'Invalid session' })
  }
}
