'use client'

import Link from 'next/link'
import { ArrowLeft, Wheat, Shield } from 'lucide-react'

export default function PrivacyPolicy() {
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
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-green max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to FarmCon's Privacy Policy. At FarmCon, we understand that privacy is crucial, especially for farmers who entrust us with their agricultural and business data. This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our platform, mobile application, and services. By using FarmCon, you agree to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Information You Provide to Us</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, and password</li>
                    <li><strong>Profile Information:</strong> Farm location, size of farmland, crop types, farming experience</li>
                    <li><strong>Business Information:</strong> Bank account details for transactions, GST number, business registration details</li>
                    <li><strong>Transaction Data:</strong> Purchase and sales history, payment information, billing addresses</li>
                    <li><strong>Communication Data:</strong> Messages, support tickets, feedback, and survey responses</li>
                    <li><strong>Content:</strong> Photos of crops, product listings, reviews, and other user-generated content</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Information Collected Automatically</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, mobile network information</li>
                    <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform, search queries</li>
                    <li><strong>Location Data:</strong> GPS coordinates (with your permission), IP address-based location</li>
                    <li><strong>Log Data:</strong> IP address, browser type, access times, pages viewed, crash reports</li>
                    <li><strong>Cookies and Tracking:</strong> Information collected through cookies and similar technologies (see our Cookie Policy)</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Information from Third Parties</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Market price data from government agricultural departments</li>
                    <li>Weather information from meteorological services</li>
                    <li>Payment verification from payment processors</li>
                    <li>Social media profile information if you choose to connect your accounts</li>
                    <li>Agricultural recommendations from partner research institutions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Provide Services:</strong> To operate FarmCon, manage your account, and deliver the features you use</li>
                <li><strong>Process Transactions:</strong> To facilitate purchases, sales, equipment rentals, and payments</li>
                <li><strong>Personalization:</strong> To customize content, recommendations, and market prices relevant to your location and crops</li>
                <li><strong>Communication:</strong> To send you updates, notifications, market alerts, farming tips, and respond to your inquiries</li>
                <li><strong>Analytics and Improvement:</strong> To analyze usage patterns, improve our services, and develop new features</li>
                <li><strong>Marketing:</strong> To send promotional materials about agricultural products, services, and offers (with your consent)</li>
                <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
                <li><strong>Legal Compliance:</strong> To comply with laws, regulations, and legal processes</li>
                <li><strong>Research:</strong> To conduct agricultural research and generate insights (using anonymized data)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may share your information in the following circumstances:
              </p>

              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-1">With Other Users</h3>
                  <p className="text-gray-700">Your public profile, product listings, and reviews may be visible to other FarmCon users. You can control what information is public in your privacy settings.</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-1">With Service Providers</h3>
                  <p className="text-gray-700">We work with third-party companies for payment processing, cloud hosting, analytics, customer support, and marketing services. These providers only access information needed to perform their services.</p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-1">For Business Transactions</h3>
                  <p className="text-gray-700">If FarmCon is involved in a merger, acquisition, or sale of assets, your information may be transferred to the new owner.</p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-1">Legal Requirements</h3>
                  <p className="text-gray-700">We may disclose your information if required by law, court order, or to protect rights, property, or safety of FarmCon, our users, or the public.</p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-1">With Your Consent</h3>
                  <p className="text-gray-700">We may share your information with other parties when you give us explicit permission to do so.</p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>We will never sell your personal information to third parties.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We take the security of your data seriously and implement multiple layers of protection:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Encryption of data in transit using SSL/TLS protocols</li>
                <li>Encryption of sensitive data at rest in our databases</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls limiting employee access to personal information</li>
                <li>Secure authentication mechanisms including two-factor authentication</li>
                <li>Regular backups to prevent data loss</li>
                <li>Compliance with industry-standard security practices</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have the following rights regarding your personal information:
              </p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900">Access</h3>
                  <p className="text-gray-700">Request a copy of the personal information we hold about you</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Correction</h3>
                  <p className="text-gray-700">Update or correct inaccurate or incomplete information</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Deletion</h3>
                  <p className="text-gray-700">Request deletion of your personal information (subject to legal obligations)</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Data Portability</h3>
                  <p className="text-gray-700">Request a copy of your data in a structured, machine-readable format</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Objection</h3>
                  <p className="text-gray-700">Object to certain processing of your personal information, especially for marketing purposes</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Restriction</h3>
                  <p className="text-gray-700">Request that we restrict processing of your information in certain circumstances</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Withdraw Consent</h3>
                  <p className="text-gray-700">Withdraw consent for processing where consent was the legal basis</p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at privacy@farmcon.in. We will respond to your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Account information is retained while your account is active. Transaction records are kept for 7 years as required by Indian tax laws. After you delete your account, we may retain certain information for backup, archival, fraud prevention, and legal compliance purposes. Anonymized data may be retained indefinitely for analytics and research.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                FarmCon is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you are under 18, please do not use our services or provide any information. If we discover that we have collected information from a child under 18, we will delete it immediately. If you believe we might have information from a child, please contact us at privacy@farmcon.in.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information is primarily stored on servers located in India. If we transfer data outside India, we ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws. By using FarmCon, you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by email, platform notification, or by posting a prominent notice on our website. The "Last updated" date at the top indicates when this policy was last revised. Your continued use of FarmCon after changes are posted constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions, concerns, or complaints about this Privacy Policy or our data practices, please contact our Privacy Team:
              </p>
              <div className="bg-green-50 rounded-xl p-6 space-y-2">
                <p className="text-gray-700"><strong>Privacy Officer:</strong> FarmCon Privacy Team</p>
                <p className="text-gray-700"><strong>Email:</strong> privacy@farmcon.in</p>
                <p className="text-gray-700"><strong>Phone:</strong> +91 1800-XXX-XXXX (Toll Free)</p>
                <p className="text-gray-700"><strong>Address:</strong> FarmCon Technologies Pvt. Ltd., Bangalore, Karnataka, India</p>
                <p className="text-gray-700 mt-4">
                  <strong>Response Time:</strong> We aim to respond to all privacy inquiries within 7 business days.
                </p>
              </div>
            </section>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Our Commitment to Farmers</h3>
              <p className="text-gray-800 leading-relaxed">
                At FarmCon, we recognize that your trust is earned through transparency and respect for your privacy. We are committed to protecting your personal information and using it only to enhance your farming success. Your data helps us serve you better, and we will never compromise that trust by misusing your information.
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
