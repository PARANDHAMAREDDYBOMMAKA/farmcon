'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  Sprout,
  Store,
  TreeDeciduous,
  User,
  Wheat,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { profileAPI, farmerAPI } from '@/lib/api-client'
import type { UserRole } from '@/types'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldHint } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/cn'

type Role = UserRole

const roles: { value: Role; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'consumer', label: 'Buyer', desc: 'Buy fresh produce', icon: ShoppingCart },
  { value: 'farmer', label: 'Farmer', desc: 'Sell your crops', icon: Wheat },
  { value: 'supplier', label: 'Supplier', desc: 'Sell farm supplies', icon: Store },
]

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-700" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-300 border-t-transparent animate-spin" />
          <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300" />
        </div>
        <p className="mt-3 text-sm font-semibold text-emerald-200">Loading…</p>
      </div>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const items = ['Account', 'Location', 'Password']
  return (
    <div className="flex items-center justify-between gap-2 mb-6">
      {items.map((label, i) => {
        const idx = i + 1
        const active = idx === step
        const done = idx < step
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
                done && 'bg-emerald-500 text-white',
                active && 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-200',
                !done && !active && 'bg-emerald-50 text-emerald-400',
              )}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : idx}
            </div>
            <span
              className={cn(
                'text-xs font-semibold hidden sm:inline',
                active ? 'text-emerald-900' : done ? 'text-emerald-700' : 'text-slate-400',
              )}
            >
              {label}
            </span>
            {i < items.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 rounded-full ml-1',
                  done ? 'bg-emerald-400' : 'bg-emerald-100',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'consumer' as Role,
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessName: '',
    gstNumber: '',
    farmName: '',
    farmLocation: '',
    farmSize: '',
    farmingExperience: '',
  })

  useEffect(() => {
    const roleParam = searchParams?.get('role') as Role | null
    if (roleParam && roles.some((r) => r.value === roleParam)) {
      setForm((f) => ({ ...f, role: roleParam }))
    }
  }, [searchParams])

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
          return
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    run()
  }, [router])

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }
  const on = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    update(key, e.target.value as any)

  const validateStep1 = () => {
    if (!form.fullName.trim()) return 'Please enter your full name.'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Please enter a valid email.'
    if (!form.phone.trim()) return 'Please enter your phone number.'
    return null
  }

  const validateStep2 = () => {
    if (!form.address.trim()) return 'Please enter your address.'
    if (!form.city.trim()) return 'Please enter your city.'
    if (!form.state.trim()) return 'Please enter your state.'
    if (!form.pincode.trim()) return 'Please enter your pincode.'
    return null
  }

  const validateStep3 = () => {
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const next = () => {
    setError('')
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null
    if (err) {
      setError(err)
      return
    }
    setStep((s) => Math.min(3, s + 1))
  }
  const back = () => {
    setError('')
    setStep((s) => Math.max(1, s - 1))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const v = validateStep3()
    if (v) {
      setError(v)
      return
    }
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role: form.role,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Signup failed. Please try again.')
        setLoading(false)
        return
      }

      try {
        await profileAPI.upsertProfile({
          id: data.user.id,
          email: form.email,
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          businessName: form.businessName || undefined,
          gstNumber: form.gstNumber || undefined,
        })

        if (form.role === 'farmer' && (form.farmName || form.farmSize)) {
          await farmerAPI.upsertFarmerProfile({
            id: data.user.id,
            farmName: form.farmName || undefined,
            farmLocation: form.farmLocation || undefined,
            farmSize: form.farmSize ? parseFloat(form.farmSize) : undefined,
            farmingExperience: form.farmingExperience
              ? parseInt(form.farmingExperience)
              : undefined,
          })
        }

        await supabase.auth.updateUser({
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role: form.role,
            city: form.city,
            state: form.state,
          },
        })

        router.push('/dashboard?welcome=true')
      } catch (profileErr: any) {
        setError(`Failed to create profile: ${profileErr?.message || 'Unknown error'}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) return <LoadingScreen />

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-bold text-emerald-300 hover:text-white">
            Sign in
          </Link>
        </>
      }
      heroTitle={
        <>
          Join the{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            revolution.
          </span>
        </>
      }
      heroSubtitle="Connect with thousands of farmers, suppliers, and buyers across India — on a single platform."
      heroImage="https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1400&auto=format&fit=crop"
      heroBullets={[
        { icon: <Sprout className="w-5 h-5 text-white" />, text: 'Free to join, always' },
        { icon: <Wheat className="w-5 h-5 text-white" />, text: '10,000+ active users' },
        { icon: <Store className="w-5 h-5 text-white" />, text: 'Farmers · Buyers · Suppliers' },
      ]}
    >
      <Stepper step={step} />

      <form onSubmit={step === 3 ? submit : (e) => e.preventDefault()} className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        {step === 1 && (
          <>
            <div>
              <Label>
                <User className="w-3.5 h-3.5 text-emerald-600" />I am a
              </Label>
              <div className="grid grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const Icon = r.icon
                  const active = form.role === r.value
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => update('role', r.value)}
                      className={cn(
                        'relative p-3 rounded-xl border-2 text-center transition-all',
                        active
                          ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/15'
                          : 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50',
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1.5',
                          active
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                            : 'bg-emerald-100 text-emerald-600',
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p
                        className={cn(
                          'text-sm font-bold',
                          active ? 'text-emerald-800' : 'text-emerald-900',
                        )}
                      >
                        {r.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="fullName" required>
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Full name
              </Label>
              <Input
                id="fullName"
                required
                value={form.fullName}
                onChange={on('fullName')}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" required>
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={on('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="phone" required>
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={on('phone')}
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                />
              </div>
            </div>

            <Button type="button" size="lg" className="w-full" onClick={next}>
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <Label htmlFor="address" required>
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Address
              </Label>
              <Input
                id="address"
                required
                value={form.address}
                onChange={on('address')}
                placeholder="House / street / landmark"
                autoComplete="street-address"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" required>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  City
                </Label>
                <Input
                  id="city"
                  required
                  value={form.city}
                  onChange={on('city')}
                  placeholder="City"
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <Label htmlFor="state" required>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  State
                </Label>
                <Input
                  id="state"
                  required
                  value={form.state}
                  onChange={on('state')}
                  placeholder="State"
                  autoComplete="address-level1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pincode" required>
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Pincode
              </Label>
              <Input
                id="pincode"
                required
                value={form.pincode}
                onChange={on('pincode')}
                placeholder="000000"
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </div>

            {form.role === 'supplier' && (
              <div className="pt-4 border-t-2 border-emerald-100 space-y-4">
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  Business details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business name</Label>
                    <Input
                      id="businessName"
                      value={form.businessName}
                      onChange={on('businessName')}
                      placeholder="Business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstNumber">GST number</Label>
                    <Input
                      id="gstNumber"
                      value={form.gstNumber}
                      onChange={on('gstNumber')}
                      placeholder="GSTIN"
                    />
                  </div>
                </div>
              </div>
            )}

            {form.role === 'farmer' && (
              <div className="pt-4 border-t-2 border-emerald-100 space-y-4">
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-emerald-600" />
                  Farm details{' '}
                  <span className="text-xs font-medium text-slate-500 ml-1">(optional)</span>
                </h3>
                <div>
                  <Label htmlFor="farmName">Farm name</Label>
                  <Input
                    id="farmName"
                    value={form.farmName}
                    onChange={on('farmName')}
                    placeholder="Your farm name"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="farmSize">
                      <TreeDeciduous className="w-3.5 h-3.5 text-emerald-500" />
                      Size (acres)
                    </Label>
                    <Input
                      id="farmSize"
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.farmSize}
                      onChange={on('farmSize')}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="farmingExperience">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      Experience (yrs)
                    </Label>
                    <Input
                      id="farmingExperience"
                      type="number"
                      min="0"
                      value={form.farmingExperience}
                      onChange={on('farmingExperience')}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" size="lg" onClick={back}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="button" size="lg" className="flex-1" onClick={next}>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" required>
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={on('password')}
                  placeholder="At least 6 chars"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" required>
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={on('confirmPassword')}
                  placeholder="Re-enter"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <FieldHint>Mix letters, numbers, and symbols for a stronger password.</FieldHint>

            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" onClick={back}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500 pt-2">
              By creating an account, you agree to our{' '}
              <Link href="/terms-of-service" className="font-semibold text-emerald-700 hover:text-emerald-900">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="font-semibold text-emerald-700 hover:text-emerald-900">
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}
      </form>

      {step === 1 && (
        <>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Or
              </span>
            </div>
          </div>
          <Button href="/auth/email-otp" variant="outline" size="lg" className="w-full">
            <Mail className="w-4 h-4" />
            <span>Sign up with Email OTP</span>
          </Button>
        </>
      )}
    </AuthShell>
  )
}

export default function SignUp() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SignUpForm />
    </Suspense>
  )
}
