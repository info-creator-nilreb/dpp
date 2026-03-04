/**
 * Server-side Stripe instance (Secret Key).
 * Set STRIPE_SECRET_KEY in environment.
 */
import Stripe from "stripe"

let stripe: Stripe | null = null

export function getStripeServer(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    stripe = new Stripe(key)
  }
  return stripe
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
