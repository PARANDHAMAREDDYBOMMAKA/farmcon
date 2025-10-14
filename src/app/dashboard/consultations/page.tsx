'use client'

import { useState } from 'react'
import CalComBooking from '@/components/booking/CalComBooking'
import Link from 'next/link'

interface ExpertService {
  id: string
  name: string
  title: string
  specialty: string
  description: string
  calLink: string
  image: string
  experience: string
  languages: string[]
  rating: number
  consultations: number
}

const EXPERT_SERVICES: ExpertService[] = [
  {
    id: '1',
    name: 'Dr. Rajesh Kumar',
    title: 'Agricultural Expert',
    specialty: 'Crop Management & Pest Control',
    description: 'Expert in sustainable farming practices, crop rotation, and integrated pest management. 20+ years of experience helping farmers maximize yields.',
    calLink: 'farmcon/crop-expert', 
    image: '👨‍🌾',
    experience: '20+ years',
    languages: ['English', 'Hindi', 'Telugu'],
    rating: 4.9,
    consultations: 2500
  },
  {
    id: '2',
    name: 'Dr. Priya Sharma',
    title: 'Soil Science Specialist',
    specialty: 'Soil Health & Fertilization',
    description: 'Specialized in soil testing, nutrient management, and organic farming. Helping farmers improve soil quality and reduce chemical dependency.',
    calLink: 'farmcon/soil-expert', 
    image: '👩‍🌾',
    experience: '15+ years',
    languages: ['English', 'Hindi', 'Marathi'],
    rating: 4.8,
    consultations: 1800
  },
  {
    id: '3',
    name: 'Amit Patel',
    title: 'Agri-Business Consultant',
    specialty: 'Market Analysis & Business Strategy',
    description: 'Expert in agricultural economics, market trends, and farm business planning. Helping farmers maximize profitability.',
    calLink: 'farmcon/business-consultant', 
    image: '👨‍💼',
    experience: '12+ years',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.7,
    consultations: 1200
  }
]

export default function ConsultationsPage() {
  const [selectedExpert, setSelectedExpert] = useState<ExpertService | null>(null)
  const [showBooking, setShowBooking] = useState(false)

  const handleBookConsultation = (expert: ExpertService) => {
    setSelectedExpert(expert)
    setShowBooking(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expert Consultations</h1>
              <p className="text-gray-600 mt-2">Book free consultations with agricultural experts</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {!showBooking ? (
          <>
            {}
            <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🎓</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-900">100% FREE Expert Consultation</h3>
                  <p className="text-green-700 mt-1">
                    Book a free 30-minute video consultation with our agricultural experts. Get personalized advice on crop management, soil health, pest control, and more.
                  </p>
                  <ul className="mt-3 space-y-1 text-green-600 text-sm">
                    <li>✓ No hidden charges - Completely free</li>
                    <li>✓ Choose your convenient time slot</li>
                    <li>✓ Video or phone consultation</li>
                    <li>✓ Get personalized recommendations</li>
                  </ul>
                </div>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXPERT_SERVICES.map((expert) => (
                <div key={expert.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {}
                  <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white">
                    <div className="flex items-center space-x-4">
                      <div className="text-6xl">{expert.image}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{expert.name}</h3>
                        <p className="text-green-100 text-sm">{expert.title}</p>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {expert.specialty}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {expert.description}
                    </p>

                    {}
                    <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-gray-100">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{expert.rating}</div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{expert.experience}</div>
                        <div className="text-xs text-gray-500">Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{expert.consultations}+</div>
                        <div className="text-xs text-gray-500">Consultations</div>
                      </div>
                    </div>

                    {}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">Languages:</div>
                      <div className="flex flex-wrap gap-2">
                        {expert.languages.map((lang) => (
                          <span key={lang} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {}
                    <button
                      onClick={() => handleBookConsultation(expert)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>📅</span>
                      <span>Book Free Consultation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {}
            <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">👆</div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Choose Expert</h3>
                  <p className="text-sm text-gray-600">Select the expert based on your needs</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Pick Time Slot</h3>
                  <p className="text-sm text-gray-600">Choose a convenient date and time</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">📝</div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Share Details</h3>
                  <p className="text-sm text-gray-600">Provide your contact info and query</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <h3 className="font-semibold text-gray-900 mb-2">4. Get Expert Advice</h3>
                  <p className="text-sm text-gray-600">Join the video call at scheduled time</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-5xl">{selectedExpert?.image}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedExpert?.name}</h2>
                    <p className="text-gray-600">{selectedExpert?.specialty}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBooking(false)
                    setSelectedExpert(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Back to Experts
                </button>
              </div>

              {}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Demo Booking Widget</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This is a demo Cal.com widget. To use it in production:
                    </p>
                    <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal">
                      <li>Sign up for FREE at <a href="https://cal.com" target="_blank" rel="noopener noreferrer" className="underline">cal.com</a></li>
                      <li>Create booking pages for your experts</li>
                      <li>Replace the <code className="bg-yellow-100 px-1 rounded">calLink</code> values in the code with your actual Cal.com usernames</li>
                    </ol>
                  </div>
                </div>
              </div>

              {}
              <CalComBooking
                calLink={selectedExpert?.calLink || 'default'}
                config={{
                  theme: 'auto',
                  layout: 'month_view'
                }}
                className="w-full h-[700px] rounded-lg border border-gray-200 overflow-hidden"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
