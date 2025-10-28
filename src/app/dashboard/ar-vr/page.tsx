'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import 3D components (client-only)
const BasicARViewer = dynamic(() => import('./components/BasicARViewer'), { ssr: false })
const ProductARViewer = dynamic(() => import('./components/ProductARViewer'), { ssr: false })
const CropVisualizer = dynamic(() => import('./components/CropVisualizer'), { ssr: false })

export default function ARVRTestPage() {
  const [activeDemo, setActiveDemo] = useState<'basic' | 'product' | 'crop'>('basic')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🌾 FarmCon AR/VR Demo
          </h1>
          <p className="text-gray-600">
            Test Augmented Reality and 3D features for farming
          </p>
        </div>

        {/* Demo Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Demo:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveDemo('basic')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeDemo === 'basic'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-2">🔮</div>
              <div className="font-semibold text-gray-800">Basic 3D Viewer</div>
              <div className="text-sm text-gray-600 mt-1">
                Interactive 3D cube with controls
              </div>
            </button>

            <button
              onClick={() => setActiveDemo('product')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeDemo === 'product'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-2">🚜</div>
              <div className="font-semibold text-gray-800">Product AR Viewer</div>
              <div className="text-sm text-gray-600 mt-1">
                View equipment in your space
              </div>
            </button>

            <button
              onClick={() => setActiveDemo('crop')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeDemo === 'crop'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-2">🌱</div>
              <div className="font-semibold text-gray-800">Crop Visualizer</div>
              <div className="text-sm text-gray-600 mt-1">
                3D crop field planning
              </div>
            </button>
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeDemo === 'basic' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Basic 3D Viewer
              </h2>
              <p className="text-gray-600 mb-4">
                Interact with the 3D object: Click and drag to rotate, scroll to zoom
              </p>
              <BasicARViewer />
            </div>
          )}

          {activeDemo === 'product' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Product AR Viewer
              </h2>
              <p className="text-gray-600 mb-4">
                Preview equipment in 3D before renting
              </p>
              <ProductARViewer />
            </div>
          )}

          {activeDemo === 'crop' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Crop Field Visualizer
              </h2>
              <p className="text-gray-600 mb-4">
                Plan your crop layout with 3D visualization
              </p>
              <CropVisualizer />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <span className="text-xl mr-2">ℹ️</span>
            How to Use AR Features
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• <strong>Desktop:</strong> Use mouse to rotate and zoom 3D objects</li>
            <li>• <strong>Mobile:</strong> Tap AR button to place objects in your real environment</li>
            <li>• <strong>Requirements:</strong> Android 7+ with ARCore or iOS 11+ with ARKit</li>
            <li>• <strong>Camera:</strong> Allow camera access when prompted for AR mode</li>
          </ul>
        </div>

        {/* Feature List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">✅ Current Features</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Interactive 3D object viewing</li>
              <li>• Rotate, zoom, pan controls</li>
              <li>• Mobile-responsive design</li>
              <li>• WebXR AR support (mobile)</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">🚀 Coming Soon</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Crop disease detection via camera</li>
              <li>• VR farm tours (360°)</li>
              <li>• Multi-user AR collaboration</li>
              <li>• Custom 3D product models</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
