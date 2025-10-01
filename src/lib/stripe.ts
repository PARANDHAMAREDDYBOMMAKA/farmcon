import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Lazy load stripe to prevent build-time errors
let stripeInstance: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!stripeInstance) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing Stripe secret key')
      }
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-08-27.basil',
      })
    }
    return (stripeInstance as any)[prop]
  }
})

export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing Stripe publishable key')
  }
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}