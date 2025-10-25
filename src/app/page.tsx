'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wheat, BarChart3, Smartphone, Lock, Target, Zap, Sprout, DollarSign, ShoppingCart, Truck, Store, Phone, Mail, MapPin, Heart, Globe } from 'lucide-react'

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscriptionMessage, setSubscriptionMessage] = useState('')
  const router = useRouter()

  const carouselImages = [
    {
      src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1200&auto=format&fit=crop',
      alt: 'Smart farming with technology'
    },
    {
      src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1200&auto=format&fit=crop',
      alt: 'Successful wheat harvest'
    },
    {
      src: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1200&auto=format&fit=crop',
      alt: 'Modern agricultural practices'
    },
    {
      src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop',
      alt: 'Sustainable farming methods'
    },
    {
      src: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop',
      alt: 'Indian farmer in field'
    },
    {
      src: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop',
      alt: 'Organic vegetable farming'
    },
    {
      src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1200&auto=format&fit=crop',
      alt: 'Rice paddy cultivation'
    }
  ]

  useEffect(() => {
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setSubscriptionMessage('Please enter a valid email address')
      return
    }

    setIsSubscribing(true)
    setSubscriptionMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscriptionMessage('Successfully subscribed! Check your email.')
        setEmail('')
      } else {
        setSubscriptionMessage(data.error || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      setSubscriptionMessage('An error occurred. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {}
      <header className="fixed w-full top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200/50 shadow-sm transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Wheat className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">FarmCon</span>
                <p className="text-xs text-gray-900">Smart Farming</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/auth/signin"
                className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                href="https://farmcon-cyan.vercel.app/"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-6 sm:px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {}
      <main className="pt-20">
        <div className="relative bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30 py-16 lg:py-24 overflow-hidden">
          {}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {}
              <div className="text-left space-y-8 lg:pr-8">
                {}
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                  Transform Your Farm with{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Smart Technology
                    </span>
                    <span className="absolute bottom-2 left-0 w-full h-3 bg-green-200/50 -z-10"></span>
                  </span>
                </h1>

                {}
                <p className="text-lg lg:text-xl text-gray-900 leading-relaxed max-w-xl">
                  Join thousands of Indian farmers increasing yields by{' '}
                  <span className="font-bold text-green-600">40%</span> and profits by{' '}
                  <span className="font-bold text-green-600">60%</span> with our AI-powered farming platform.
                </p>

                {}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: <BarChart3 className="w-6 h-6 text-green-600" />, text: 'Real-time Market Prices' },
                    { icon: <Wheat className="w-6 h-6 text-green-600" />, text: 'Smart Crop Management' },
                    { icon: <Smartphone className="w-6 h-6 text-green-600" />, text: 'Mobile-First Platform' },
                    { icon: <Lock className="w-6 h-6 text-green-600" />, text: '100% Secure & Private' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      {item.icon}
                      <span className="text-sm font-medium text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>

                {}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                  <Link
                    href="https://farmcon-cyan.vercel.app/"
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                  >
                    <span>Get Started</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="#features"
                    className="group inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-gray-300 bg-white text-gray-700 font-semibold text-base hover:border-green-600 hover:text-green-600 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>Watch Demo</span>
                  </Link>
                </div>

              </div>

              {}
              <div className="relative lg:h-[650px]">
                {}
                <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                  {}
                  {carouselImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      {}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    </div>
                  ))}

                  {}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-30 bg-black/20 backdrop-blur-md px-4 py-3 rounded-full">
                    {carouselImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex
                            ? 'w-8 bg-white shadow-lg'
                            : 'w-2 bg-white/60 hover:bg-white/80'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {}
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex === 0 ? carouselImages.length - 1 : currentImageIndex - 1)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex === carouselImages.length - 1 ? 0 : currentImageIndex + 1)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 py-20 pr-3">
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center text-white">
                  <p className="text-5xl lg:text-6xl font-bold mb-2">{stat.value}</p>
                  <p className="text-green-50 text-base lg:text-lg font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-green-600 uppercase tracking-wide mb-3">
                Why FarmCon?
              </h2>
              <p className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                India&apos;s Most Trusted{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Farming Platform
                </span>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {whyFarmcon.map((item, idx) => (
                <div key={idx} className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-900 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div id="features" className="py-24 sm:py-32 bg-gradient-to-b from-white to-green-50/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-base font-semibold text-green-600 uppercase tracking-wide mb-3">
                Everything You Need
              </h2>
              <p className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                Farming Made Simple with{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Smart Technology
                </span>
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-900">
                From planting to selling, manage everything from your phone. No technical knowledge required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
                >
                  <div className="relative">
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 shadow-md">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-base text-gray-900 leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <Link href={feature.link} className="inline-flex items-center text-green-600 font-semibold">
                      Learn more
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-300 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-16 pb-16 border-b border-gray-800">
            {/* Newsletter Section - Premium Design */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgb(16, 185, 129) 1px, transparent 0)`,
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              {/* Gradient Orbs */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-teal-500/20 to-green-500/30 rounded-full blur-3xl"></div>

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 p-8 md:p-12 lg:p-16">
                {/* Left Side - Content */}
                <div className="flex flex-col justify-center space-y-8">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 w-fit">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-green-400 text-sm font-semibold">10,000+ Farmers Subscribed</span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
                      Never Miss an
                      <span className="block bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        Update Again
                      </span>
                    </h3>
                    <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
                      Get exclusive farming insights, real-time market prices, and expert tips delivered straight to your inbox every week.
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        icon: <BarChart3 className="w-6 h-6 text-green-400" />,
                        title: 'Market Alerts',
                        desc: 'Price updates'
                      },
                      {
                        icon: <Sprout className="w-6 h-6 text-emerald-400" />,
                        title: 'Farming Tips',
                        desc: 'Expert advice'
                      },
                      {
                        icon: <Target className="w-6 h-6 text-teal-400" />,
                        title: 'Crop Insights',
                        desc: 'Data-driven'
                      },
                      {
                        icon: <Zap className="w-6 h-6 text-yellow-400" />,
                        title: 'News & Trends',
                        desc: 'Stay ahead'
                      }
                    ].map((feature, idx) => (
                      <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-green-500/30 transition-all duration-300 group">
                        <div className="mb-2 transform group-hover:scale-110 transition-transform">
                          {feature.icon}
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">{feature.title}</h4>
                        <p className="text-gray-400 text-xs">{feature.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-400 text-xs">Trusted by thousands of farmers</p>
                    </div>
                  </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex flex-col justify-center">
                  <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl">
                    {/* Form Header */}
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30 transform hover:rotate-6 transition-transform">
                        <Mail className="w-10 h-10 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Subscribe to Our Newsletter</h4>
                      <p className="text-gray-600">Join our community of successful farmers</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubscribe} className="space-y-5">
                      <div className="space-y-4">
                        <div className="relative group">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                              <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                            </div>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="farmer@example.com"
                              disabled={isSubscribing}
                              required
                              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:bg-gray-50 text-base font-medium transition-all"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubscribing}
                          className="w-full group relative overflow-hidden px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative z-10 text-white">
                            {isSubscribing ? (
                              <span className="flex items-center gap-2 text-white">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="text-white">Subscribing...</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-white">
                                <span className="text-white">Get Started - It's Free</span>
                                <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </span>
                            )}
                          </span>
                        </button>
                      </div>

                      {/* Success/Error Message */}
                      {subscriptionMessage && (
                        <div className={`flex items-start gap-3 p-4 rounded-xl ${
                          subscriptionMessage.includes('Successfully')
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-red-50 border-2 border-red-200'
                        }`}>
                          {subscriptionMessage.includes('Successfully') ? (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${
                              subscriptionMessage.includes('Successfully') ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {subscriptionMessage}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Privacy Notice */}
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          By subscribing, you agree to our{' '}
                          <Link href="/privacy-policy" className="text-green-600 hover:text-green-700 underline font-semibold transition-colors">
                            Privacy Policy
                          </Link>
                          . We respect your privacy and you can unsubscribe anytime.
                        </p>
                      </div>

                      {/* Benefits List */}
                      <div className="space-y-3 pt-2">
                        {[
                          'Weekly market price updates',
                          'Exclusive farming tips & guides',
                          'Early access to new features'
                        ].map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-xl">
                  <Wheat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">FarmCon</span>
                  <p className="text-xs text-gray-400">Smart Farming Platform</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                Empowering Indian farmers with cutting-edge technology to maximize yields and profits.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5 text-green-500" />
                  <span>+91 1800-XXX-XXXX (Toll Free)</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-green-500" />
                  <span>support@farmcon.in</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <span>Bangalore, Karnataka, India</span>
                </div>
              </div>

              <div className="flex gap-3">
                {socialLinks.map((social, idx) => (
                  <Link
                    key={idx}
                    href={social.href}
                    className="w-11 h-11 rounded-full bg-gray-800 hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>

            {footerLinks.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-white font-bold text-lg mb-5 relative inline-block">
                  {section.title}
                  <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600"></span>
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link href={link.href} className="text-gray-400 hover:text-green-500 transition-colors hover:translate-x-1 inline-block">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                &copy; {new Date().getFullYear()} FarmCon. All rights reserved. Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for Indian farmers.
              </p>
              <div className="flex gap-6 text-sm">
                <Link href="/privacy-policy" className="text-gray-400 hover:text-green-500 transition-colors">Privacy Policy</Link>
                <span className="text-gray-600">•</span>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-green-500 transition-colors">Terms of Service</Link>
                <span className="text-gray-600">•</span>
                <Link href="/cookie-policy" className="text-gray-400 hover:text-green-500 transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -20px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 20px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

const whyFarmcon = [
  {
    icon: <Target className="w-10 h-10 text-white" />,
    title: 'Built for Indian Farmers',
    description: 'Designed specifically for Indian agriculture with local crop varieties, regional languages, and mandi price integration.',
  },
  {
    icon: <Lock className="w-10 h-10 text-white" />,
    title: '100% Secure & Trusted',
    description: 'Your data is encrypted and protected. Verified by 10,000+ farmers and backed by agricultural experts.',
  },
  {
    icon: <Zap className="w-10 h-10 text-white" />,
    title: 'Real Results',
    description: 'Farmers see 40% yield increase and 60% profit growth in the first year. Join the success story.',
  },
]

const features = [
  {
    icon: <Sprout className="w-12 h-12 text-green-600" />,
    title: 'Smart Crop Management',
    description: 'Track crops from seed to harvest. Get AI-powered recommendations, weather alerts, and disease detection.',
    link: 'https://farmcon-cyan.vercel.app/'
  },
  {
    icon: <DollarSign className="w-12 h-12 text-green-600" />,
    title: 'Live Market Prices',
    description: 'Real-time mandi prices across India. Know the best time and place to sell for maximum profits.',
    link: 'https://farmcon-cyan.vercel.app/'
  },
  {
    icon: <ShoppingCart className="w-12 h-12 text-green-600" />,
    title: 'Agricultural Supplies',
    description: 'Buy certified seeds, fertilizers, and equipment from verified suppliers at wholesale prices.',
    link: 'https://farmcon-cyan.vercel.app/'
  },
  {
    icon: <Truck className="w-12 h-12 text-green-600" />,
    title: 'Equipment Rental',
    description: 'Rent tractors, harvesters, and modern equipment at affordable rates. Share with neighbors.',
    link: 'https://farmcon-cyan.vercel.app/'
  },
  {
    icon: <Store className="w-12 h-12 text-green-600" />,
    title: 'Direct Sales',
    description: 'Sell directly to consumers and retailers. No middlemen, get 30-40% better prices.',
    link: 'https://farmcon-cyan.vercel.app/'
  },
  {
    icon: <Smartphone className="w-12 h-12 text-green-600" />,
    title: 'Mobile App',
    description: 'Works offline in rural areas. Available in Hindi, Tamil, Telugu, and 10+ regional languages.',
    link: 'https://farmcon-cyan.vercel.app/'
  },
]

const stats = [
  { value: '10K+', label: 'Active Farmers' },
  { value: '₹500Cr+', label: 'Crops Sold', suffix: 'Cr+' },
  { value: '40%', label: 'Avg. Yield Increase' },
  { value: '24/7', label: 'Expert Support' },
]

const socialLinks = [
  { icon: <Globe className="w-5 h-5 text-white" />, href: '#', label: 'Facebook' },
  { icon: <Globe className="w-5 h-5 text-white" />, href: '#', label: 'Twitter' },
  { icon: <Globe className="w-5 h-5 text-white" />, href: '#', label: 'Instagram' },
  { icon: <Globe className="w-5 h-5 text-white" />, href: '#', label: 'YouTube' },
]

const footerLinks = [
  {
    title: 'Product',
    links: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#' },
      { name: 'Mobile App', href: '#' },
      { name: 'API', href: '#' },
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Press', href: '#' },
    ]
  },
  {
    title: 'Support',
    links: [
      { name: 'Help Center', href: '#' },
      { name: 'Contact Us', href: '#' },
      { name: 'WhatsApp', href: '#' },
      { name: 'Training', href: '#' },
    ]
  },
]

