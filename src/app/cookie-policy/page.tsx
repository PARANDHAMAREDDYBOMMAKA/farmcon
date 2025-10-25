'use client'

import Link from 'next/link'
import { ArrowLeft, Wheat, Cookie } from 'lucide-react'

export default function CookiePolicy() {
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
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Cookie className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-green max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit our website or use our mobile application. They help us provide you with a better experience by remembering your preferences, analyzing how you use our platform, and improving our services. Cookies contain information that is transferred to your device's hard drive.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How FarmCon Uses Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use cookies for several important purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Authentication:</strong> To keep you logged in and secure your account</li>
                <li><strong>Preferences:</strong> To remember your language settings, location, and display preferences</li>
                <li><strong>Analytics:</strong> To understand how you use FarmCon and improve our services</li>
                <li><strong>Performance:</strong> To ensure the platform loads quickly and functions properly</li>
                <li><strong>Marketing:</strong> To show you relevant agricultural products and services</li>
                <li><strong>Security:</strong> To detect and prevent fraudulent activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h2>

              <div className="space-y-6">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Essential Cookies (Required)</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies are necessary for the platform to function and cannot be disabled:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>User authentication and session management</li>
                    <li>Security and fraud prevention</li>
                    <li>Load balancing and performance optimization</li>
                    <li>Shopping cart functionality</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Functional Cookies (Optional)</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies enhance your experience by remembering your choices:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Language and regional preferences</li>
                    <li>Display settings and customizations</li>
                    <li>Recently viewed products and searches</li>
                    <li>Notification preferences</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics Cookies (Optional)</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies help us understand how you use FarmCon:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Pages visited and time spent on platform</li>
                    <li>Features used and navigation patterns</li>
                    <li>Error tracking and performance monitoring</li>
                    <li>Device and browser information</li>
                  </ul>
                  <p className="text-gray-600 text-sm mt-3">
                    We use Google Analytics and other analytics services for this purpose.
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Marketing Cookies (Optional)</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies help us show you relevant advertisements:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Tracking marketing campaign effectiveness</li>
                    <li>Personalizing advertisements based on your interests</li>
                    <li>Limiting the number of times you see an ad</li>
                    <li>Social media integration and sharing</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use services from trusted third parties who may also set cookies on your device:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Google Analytics:</strong> For analyzing website traffic and user behavior</li>
                <li><strong>Payment Processors:</strong> For secure payment processing (Razorpay, Paytm, etc.)</li>
                <li><strong>Social Media Platforms:</strong> For social sharing functionality (Facebook, Twitter, WhatsApp)</li>
                <li><strong>Cloud Services:</strong> For content delivery and performance optimization</li>
                <li><strong>Customer Support:</strong> For chat and support services</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                These third parties have their own cookie policies, and we do not control their cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How Long Do Cookies Last?</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Cookies have different lifespans:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a set period (typically 30 days to 2 years) or until you delete them</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Most of our cookies are persistent to provide a better user experience across visits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Managing Your Cookie Preferences</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have control over cookies and can manage them in several ways:
              </p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Cookie Consent Banner</h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  When you first visit FarmCon, you'll see a cookie consent banner where you can:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Accept all cookies for the full experience</li>
                  <li>Decline optional cookies (only essential cookies will be used)</li>
                  <li>Customize your preferences by cookie category</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Browser Settings</h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  You can also manage cookies through your browser settings:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Block all cookies (may affect website functionality)</li>
                  <li>Delete existing cookies from your device</li>
                  <li>Allow cookies only from trusted websites</li>
                  <li>Receive notifications when cookies are set</li>
                </ul>
                <p className="text-gray-600 text-sm mt-3">
                  Note: Disabling essential cookies may prevent you from using certain features of FarmCon.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Do Not Track Signals</h2>
              <p className="text-gray-700 leading-relaxed">
                Some browsers have a "Do Not Track" (DNT) feature that signals websites that you do not want your online activities tracked. Currently, there is no industry standard for how to respond to DNT signals. FarmCon does not currently respond to DNT signals, but we respect your privacy choices through our cookie consent mechanism.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Mobile Application</h2>
              <p className="text-gray-700 leading-relaxed">
                Our mobile application may use similar technologies to cookies, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>Device identifiers (UDID, Advertising ID)</li>
                <li>Local storage and cache</li>
                <li>Mobile analytics SDKs</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                You can manage these through your device settings under Privacy or App Permissions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or our practices. We will notify you of material changes by posting the updated policy on our platform and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="bg-green-50 rounded-xl p-6 space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> privacy@farmcon.in</p>
                <p className="text-gray-700"><strong>Phone:</strong> +91 1800-XXX-XXXX (Toll Free)</p>
                <p className="text-gray-700"><strong>Address:</strong> FarmCon Technologies Pvt. Ltd., Bangalore, Karnataka, India</p>
              </div>
            </section>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 mt-8">
              <p className="text-gray-800 leading-relaxed">
                <strong>Your Privacy Matters:</strong> At FarmCon, we are committed to transparency about our data practices. We believe farmers deserve to know how their data is used and to have control over their privacy. If you have any concerns or questions, please don't hesitate to reach out to our privacy team.
              </p>
            </div>
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
