'use client'

import { useState } from 'react'
import ChatBot from 'react-simple-chatbot'
import { ThemeProvider } from 'styled-components'

const theme = {
  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headerBgColor: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
  headerFontColor: '#fff',
  headerFontSize: '18px',
  botBubbleColor: '#16a34a',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#1f2937',
}

// Custom component for product search
const ProductSearch = ({ steps, triggerNextStep }: any) => {
  const searchTerm = steps.productSearch?.value || ''

  // Simulate product search
  setTimeout(() => {
    triggerNextStep({ trigger: 'searchResults' })
  }, 1000)

  return <div className="p-2">Searching for "{searchTerm}"...</div>
}

// Custom component for crop recommendations
const CropRecommendation = ({ steps, triggerNextStep }: any) => {
  const season = steps.season?.value || ''

  setTimeout(() => {
    triggerNextStep({ trigger: 'cropResults' })
  }, 1000)

  return <div className="p-2">Finding best crops for {season}...</div>
}

const chatbotSteps = [
  {
    id: 'welcome',
    message: '🌾 Welcome to FarmCon! I\'m your farming assistant. How can I help you today?',
    trigger: 'mainMenu',
  },
  {
    id: 'mainMenu',
    options: [
      { value: 'products', label: '🛒 Browse Products', trigger: 'productCategory' },
      { value: 'crops', label: '🌱 Crop Recommendations', trigger: 'cropAdvice' },
      { value: 'orders', label: '📦 Track Orders', trigger: 'trackOrders' },
      { value: 'equipment', label: '🚜 Rent Equipment', trigger: 'equipmentRental' },
      { value: 'help', label: '❓ Help & FAQs', trigger: 'helpMenu' },
    ],
  },
  // Product browsing flow
  {
    id: 'productCategory',
    message: 'What type of products are you looking for?',
    trigger: 'productOptions',
  },
  {
    id: 'productOptions',
    options: [
      { value: 'seeds', label: '🌱 Seeds', trigger: 'searchSeeds' },
      { value: 'fertilizers', label: '🧪 Fertilizers', trigger: 'searchFertilizers' },
      { value: 'pesticides', label: '🛡️ Pesticides', trigger: 'searchPesticides' },
      { value: 'tools', label: '🔧 Tools', trigger: 'searchTools' },
      { value: 'custom', label: '🔍 Custom Search', trigger: 'customSearch' },
    ],
  },
  {
    id: 'searchSeeds',
    message: 'Great! I can help you find seeds. Visit our Seeds section to see all available varieties.',
    trigger: 'actionButtons',
  },
  {
    id: 'searchFertilizers',
    message: 'We have organic and chemical fertilizers. Check out our Fertilizers section!',
    trigger: 'actionButtons',
  },
  {
    id: 'searchPesticides',
    message: 'Browse our eco-friendly and conventional pesticides in the Pesticides section.',
    trigger: 'actionButtons',
  },
  {
    id: 'searchTools',
    message: 'We have a wide range of farming tools. Visit our Tools section!',
    trigger: 'actionButtons',
  },
  {
    id: 'customSearch',
    message: 'What product are you looking for?',
    trigger: 'productSearch',
  },
  {
    id: 'productSearch',
    user: true,
    trigger: 'performSearch',
  },
  {
    id: 'performSearch',
    component: <ProductSearch />,
    asMessage: true,
    waitAction: true,
  },
  {
    id: 'searchResults',
    message: 'I found some products! Visit the Supplies page to see all available items.',
    trigger: 'actionButtons',
  },
  // Crop recommendations flow
  {
    id: 'cropAdvice',
    message: 'I can help you choose the best crops! What season are you planning for?',
    trigger: 'seasonOptions',
  },
  {
    id: 'seasonOptions',
    options: [
      { value: 'summer', label: '☀️ Summer', trigger: 'summerCrops' },
      { value: 'monsoon', label: '🌧️ Monsoon', trigger: 'monsoonCrops' },
      { value: 'winter', label: '❄️ Winter', trigger: 'winterCrops' },
      { value: 'allSeason', label: '🌍 All Seasons', trigger: 'allSeasonCrops' },
    ],
  },
  {
    id: 'summerCrops',
    message: '☀️ Best summer crops: Watermelon, Cucumber, Tomatoes, Okra, and Peppers. These crops thrive in hot weather!',
    trigger: 'actionButtons',
  },
  {
    id: 'monsoonCrops',
    message: '🌧️ Best monsoon crops: Rice, Maize, Soybeans, Cotton, and Groundnut. Perfect for the rainy season!',
    trigger: 'actionButtons',
  },
  {
    id: 'winterCrops',
    message: '❄️ Best winter crops: Wheat, Mustard, Chickpeas, Peas, and Carrots. These crops love cool weather!',
    trigger: 'actionButtons',
  },
  {
    id: 'allSeasonCrops',
    message: '🌍 All-season crops: Spinach, Lettuce, Radish, and Herbs. You can grow these year-round!',
    trigger: 'actionButtons',
  },
  // Order tracking
  {
    id: 'trackOrders',
    message: 'To track your orders, please visit the Orders page in your dashboard.',
    trigger: 'actionButtons',
  },
  // Equipment rental
  {
    id: 'equipmentRental',
    message: '🚜 We have tractors, harvesters, and more available for rent. Check our Equipment section!',
    trigger: 'actionButtons',
  },
  // Help menu
  {
    id: 'helpMenu',
    message: 'What do you need help with?',
    trigger: 'helpOptions',
  },
  {
    id: 'helpOptions',
    options: [
      { value: 'ordering', label: '🛍️ How to Order', trigger: 'howToOrder' },
      { value: 'payment', label: '💳 Payment Methods', trigger: 'paymentInfo' },
      { value: 'delivery', label: '🚚 Delivery Info', trigger: 'deliveryInfo' },
      { value: 'returns', label: '↩️ Returns Policy', trigger: 'returnsInfo' },
      { value: 'contact', label: '📞 Contact Support', trigger: 'contactInfo' },
    ],
  },
  {
    id: 'howToOrder',
    message: '1️⃣ Browse products\n2️⃣ Add to cart\n3️⃣ Proceed to checkout\n4️⃣ Choose payment method\n5️⃣ Confirm order!',
    trigger: 'actionButtons',
  },
  {
    id: 'paymentInfo',
    message: 'We accept: 💳 Credit/Debit Cards (via Stripe), 💵 Cash on Delivery, and 📱 UPI payments.',
    trigger: 'actionButtons',
  },
  {
    id: 'deliveryInfo',
    message: '🚚 We deliver across India! Delivery takes 3-7 business days. Free delivery on orders above ₹500.',
    trigger: 'actionButtons',
  },
  {
    id: 'returnsInfo',
    message: '↩️ 7-day return policy for defective products. Contact support to initiate a return.',
    trigger: 'actionButtons',
  },
  {
    id: 'contactInfo',
    message: '📞 Support: support@farmcon.com\n📱 Phone: +91-XXXXXXXXXX\n⏰ Available: Mon-Sat, 9 AM - 6 PM',
    trigger: 'actionButtons',
  },
  // Action buttons
  {
    id: 'actionButtons',
    message: 'What would you like to do next?',
    trigger: 'actionOptions',
  },
  {
    id: 'actionOptions',
    options: [
      { value: 'mainMenu', label: '🏠 Main Menu', trigger: 'mainMenu' },
      { value: 'end', label: '👋 End Chat', trigger: 'goodbye' },
    ],
  },
  {
    id: 'goodbye',
    message: 'Thank you for using FarmCon! Happy farming! 🌾',
    end: true,
  },
]

export default function FarmConChatbot() {
  const [opened, setOpened] = useState(false)

  return (
    <>
      {/* Floating Chat Button with Badge */}
      <div className="fixed bottom-6 right-6 z-50">
        {!opened && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            AI
          </div>
        )}
        <button
          onClick={() => setOpened(!opened)}
          className="relative bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-full p-5 shadow-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group"
          aria-label="Open chat"
        >
          {opened ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></span>
            </>
          )}
        </button>
        {!opened && (
          <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Need help? Chat with us! 💬
          </div>
        )}
      </div>

      {/* Chatbot */}
      {opened && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-green-100" style={{ width: '380px', height: '600px' }}>
            {/* Custom Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg">
                    🌾
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">FarmCon AI</h3>
                  <p className="text-green-100 text-xs">Your Farming Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setOpened(false)}
                className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chatbot Content */}
            <div style={{ height: 'calc(100% - 72px)' }}>
              <ThemeProvider theme={theme}>
                <ChatBot
                  steps={chatbotSteps}
                  floating={false}
                  headerTitle="🌾 FarmCon Assistant"
                  placeholder="Type your message..."
                  hideUserAvatar={true}
                  hideHeader={true}
                  botAvatar="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2316a34a'/%3E%3Ctext x='50' y='65' font-size='50' text-anchor='middle' fill='white'%3E🌾%3C/text%3E%3C/svg%3E"
                  enableSmoothScroll={true}
                  bubbleStyle={{
                    fontSize: '14px',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  bubbleOptionStyle={{
                    fontSize: '14px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: '#fff',
                    border: '2px solid #16a34a',
                    color: '#16a34a',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  customStyle={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '0',
                    boxShadow: 'none',
                  }}
                  contentStyle={{
                    height: 'calc(100% - 60px)',
                  }}
                  inputStyle={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                  }}
                  submitButtonStyle={{
                    fill: '#16a34a',
                  }}
                />
              </ThemeProvider>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
