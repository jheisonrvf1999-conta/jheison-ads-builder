import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  }
  return stripeClient
}

export const STRIPE_PLANS = {
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    price: 9700,
    currency: 'brl',
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    price: 29700,
    currency: 'brl',
  },
} as const

export async function createOrRetrieveCustomer(email: string, userId: string): Promise<string> {
  const stripe = getStripe()
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0].id
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })
  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  userId: string
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'pt-BR',
  })
  return session.url!
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
