'use client'

import Link from 'next/link'
import { ArrowLeft, Wheat } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Wheat className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">FarmCon</span>
                <p className="text-xs text-gray-600">Smart Farming</p>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-green max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to FarmCon. By accessing or using our platform, mobile application, or services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. FarmCon is designed to empower Indian farmers with technology-driven agricultural solutions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                FarmCon provides a comprehensive agricultural platform offering:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Crop management and tracking tools</li>
                <li>Real-time market price information</li>
                <li>Agricultural supplies marketplace</li>
                <li>Equipment rental services</li>
                <li>Direct-to-consumer sales platform</li>
                <li>Weather alerts and farming recommendations</li>
                <li>Expert agricultural consultation services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                To access certain features of FarmCon, you must register for an account:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must be at least 18 years old to create an account</li>
                <li>One person or entity may not maintain more than one account without permission</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Conduct and Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                When using FarmCon, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide accurate information about your crops, products, and services</li>
                <li>Not post false, misleading, or fraudulent content</li>
                <li>Respect intellectual property rights of others</li>
                <li>Not engage in any illegal activities or transactions</li>
                <li>Not harass, abuse, or harm other users</li>
                <li>Comply with all applicable agricultural and trading regulations</li>
                <li>Not attempt to manipulate market prices or engage in price fixing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Transactions and Payments</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                For marketplace transactions:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>All prices are displayed in Indian Rupees (INR)</li>
                <li>Sellers are responsible for accurate product descriptions and pricing</li>
                <li>Buyers must complete payment within the specified timeframe</li>
                <li>FarmCon may charge service fees for transactions (details provided separately)</li>
                <li>Refunds and returns are subject to our Refund Policy</li>
                <li>Payment processing is handled through secure third-party payment gateways</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              <p className="text-gray-700 leading-relaxed">
                The FarmCon platform, including its design, features, graphics, text, and code, is owned by FarmCon and protected by intellectual property laws. Users retain ownership of content they create but grant FarmCon a license to use, display, and distribute such content on the platform. You may not reproduce, distribute, or create derivative works from our platform without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data and Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy. By using FarmCon, you consent to our data practices as described in the Privacy Policy. We use industry-standard security measures to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Limitations of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Important disclaimers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>FarmCon is provided "as is" without warranties of any kind</li>
                <li>Market prices are provided for informational purposes and may not be real-time</li>
                <li>Farming recommendations are advisory only; users should exercise their own judgment</li>
                <li>We are not responsible for crop failures, losses, or damages resulting from use of our platform</li>
                <li>We do not guarantee the quality or safety of products sold through the marketplace</li>
                <li>Weather information is sourced from third parties and may not be completely accurate</li>
                <li>Our liability is limited to the fees paid by you in the past 12 months</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation of these terms, fraudulent activity, or any other reason we deem appropriate. You may also terminate your account at any time by contacting our support team. Upon termination, your right to access the platform will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service are governed by the laws of India. Any disputes arising from these terms or use of FarmCon shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka. We encourage users to contact us first to resolve any disputes amicably before pursuing legal action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. We will notify users of material changes via email or platform notification. Your continued use of FarmCon after such modifications constitutes acceptance of the updated terms. We recommend reviewing these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-green-50 rounded-xl p-6 mt-4 space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> legal@farmcon.in</p>
                <p className="text-gray-700"><strong>Phone:</strong> +91 1800-XXX-XXXX (Toll Free)</p>
                <p className="text-gray-700"><strong>Address:</strong> FarmCon Technologies Pvt. Ltd., Bangalore, Karnataka, India</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} FarmCon. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy-policy" className="hover:text-green-500 transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-green-500 transition-colors">Terms of Service</Link>
              <Link href="/cookie-policy" className="hover:text-green-500 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
