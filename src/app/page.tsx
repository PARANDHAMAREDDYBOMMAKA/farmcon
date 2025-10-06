'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [checkingAuth, setCheckingAuth] = useState(true)
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
    // Check if user is authenticated and redirect to dashboard
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // User is authenticated, redirect to dashboard
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200/50 shadow-sm transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🌾</span>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">FarmCon</span>
                <p className="text-xs text-gray-500">Smart Farming</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/auth/signin"
                className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-20">
        <div className="relative bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30 py-16 lg:py-24 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-left space-y-8 lg:pr-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-green-500/30 border border-white/20">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    ✨ 100% FREE Forever - No Hidden Charges!
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                  Transform Your Farm with{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Smart Technology
                    </span>
                    <span className="absolute bottom-2 left-0 w-full h-3 bg-green-200/50 -z-10"></span>
                  </span>
                </h1>

                {/* Description */}
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
                  Join thousands of Indian farmers increasing yields by{' '}
                  <span className="font-bold text-green-600">40%</span> and profits by{' '}
                  <span className="font-bold text-green-600">60%</span> with our AI-powered farming platform.
                </p>

                {/* Benefits List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: '📊', text: 'Real-time Market Prices' },
                    { icon: '🌾', text: 'Smart Crop Management' },
                    { icon: '📱', text: 'Mobile-First Platform' },
                    { icon: '🔒', text: '100% Secure & Private' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                  <Link
                    href="/auth/signup"
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                  >
                    <span>Get Started Free</span>
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

                {/* Trust Indicators */}
                <div className="flex items-center gap-8 pt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Free for 30 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No credit card needed</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Enhanced Image Carousel */}
              <div className="relative lg:h-[650px]">
                {/* Main Carousel Container with enhanced styling */}
                <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                  {/* Images */}
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
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    </div>
                  ))}

                  {/* Modern Carousel Indicators */}
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

                  {/* Navigation Arrows with better styling */}
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


        {/* Stats Section */}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 py-20">
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

        {/* Why Choose FarmCon - NEW SECTION */}
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
                    <span className="text-4xl">{item.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
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
              <p className="mt-6 text-lg leading-8 text-gray-600">
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
                      <span className="text-5xl">{feature.emoji}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed mb-4">
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

      {/* Enhanced Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-300 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-16 pb-12 border-b border-gray-800">
            <div className="max-w-xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Stay Updated with FarmCon</h3>
              <p className="text-gray-400 mb-6">Get farming tips, market updates, and exclusive offers directly to your inbox.</p>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button className="px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-xl">
                  <span className="text-3xl">🌾</span>
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
                  <span className="text-green-500">📞</span>
                  <span>+91 1800-XXX-XXXX (Toll Free)</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <span className="text-green-500">✉️</span>
                  <span>support@farmcon.in</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <span className="text-green-500">📍</span>
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
                    <span className="text-xl">{social.icon}</span>
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
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} FarmCon. All rights reserved. Built with ❤️ for Indian farmers.
              </p>
              <div className="flex gap-6 text-sm">
                <Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Privacy Policy</Link>
                <span className="text-gray-700">•</span>
                <Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Terms of Service</Link>
                <span className="text-gray-700">•</span>
                <Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
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
    icon: '🎯',
    title: 'Built for Indian Farmers',
    description: 'Designed specifically for Indian agriculture with local crop varieties, regional languages, and mandi price integration.',
  },
  {
    icon: '🔒',
    title: '100% Secure & Trusted',
    description: 'Your data is encrypted and protected. Verified by 10,000+ farmers and backed by agricultural experts.',
  },
  {
    icon: '💪',
    title: 'Real Results',
    description: 'Farmers see 40% yield increase and 60% profit growth in the first year. Join the success story.',
  },
]

const features = [
  {
    emoji: '🌱',
    title: 'Smart Crop Management',
    description: 'Track crops from seed to harvest. Get AI-powered recommendations, weather alerts, and disease detection.',
    link: '/auth/signup'
  },
  {
    emoji: '💰',
    title: 'Live Market Prices',
    description: 'Real-time mandi prices across India. Know the best time and place to sell for maximum profits.',
    link: '/auth/signup'
  },
  {
    emoji: '🛒',
    title: 'Agricultural Supplies',
    description: 'Buy certified seeds, fertilizers, and equipment from verified suppliers at wholesale prices.',
    link: '/auth/signup'
  },
  {
    emoji: '🚜',
    title: 'Equipment Rental',
    description: 'Rent tractors, harvesters, and modern equipment at affordable rates. Share with neighbors.',
    link: '/auth/signup'
  },
  {
    emoji: '🏪',
    title: 'Direct Sales',
    description: 'Sell directly to consumers and retailers. No middlemen, get 30-40% better prices.',
    link: '/auth/signup'
  },
  {
    emoji: '📱',
    title: 'Mobile App',
    description: 'Works offline in rural areas. Available in Hindi, Tamil, Telugu, and 10+ regional languages.',
    link: '/auth/signup'
  },
]


const stats = [
  { value: '10K+', label: 'Active Farmers' },
  { value: '₹500Cr+', label: 'Crops Sold', suffix: 'Cr+' },
  { value: '40%', label: 'Avg. Yield Increase' },
  { value: '24/7', label: 'Expert Support' },
]

const socialLinks = [
  { icon: '📘', href: '#' },
  { icon: '🐦', href: '#' },
  { icon: '📸', href: '#' },
  { icon: '📺', href: '#' },
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
