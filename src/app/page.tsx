import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600">FarmCon</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/signin" 
                className="text-sm font-medium text-gray-700 hover:text-green-600"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pb-32 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Empowering Indian Farmers with{' '}
              <span className="text-green-600">Smart Technology</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Manage your crops, track market prices, buy agricultural supplies, and sell your produce directly to consumers. Everything you need to make farming more profitable and efficient.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/signup"
                className="rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Start Farming Smart
              </Link>
              
              <Link
                href="#features"
                className="text-base font-semibold leading-6 text-gray-900 hover:text-green-600"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything farmers need in one platform
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                From crop management to direct sales, we've got you covered with modern tools designed specifically for Indian agriculture.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    🌱 Crop Management
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Track your crops from planting to harvest. Get weather updates, disease alerts, and AI-powered recommendations for optimal yield.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    💰 Market Prices
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Real-time prices from local mandis and markets. Make informed decisions about when and where to sell your produce.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    🛒 Agricultural Supplies
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Buy seeds, fertilizers, pesticides, and equipment from verified suppliers at competitive prices with doorstep delivery.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    🚜 Equipment Rental
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Rent tractors, harvesters, and other farming equipment when you need them. Share costs with neighboring farmers.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    🏪 Direct Sales
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Sell directly to consumers, restaurants, and retailers. Cut out middlemen and get better prices for your produce.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    📱 Mobile First
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Designed for mobile devices with offline support. Works even with slow internet connections in rural areas.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-xs leading-5 text-gray-500">
              Built for Indian farmers, by farmers
            </p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 FarmCon. Empowering agriculture across India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
