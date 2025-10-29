'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import AR components (client-only)
const CameraARViewer = dynamic(() => import('./components/CameraARViewer'), { ssr: false })
const WebXRARViewer = dynamic(() => import('./components/WebXRARViewer'), { ssr: false })

export default function ARVRTestPage() {
  const [activeDemo, setActiveDemo] = useState<'camera' | 'webxr'>('camera')

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🌾 FarmCon AR/VR Demo
          </h1>
          <p className="text-gray-600">
            Experience Augmented Reality for farming equipment
          </p>
        </div>

        {/* Demo Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Select AR Experience:</h2>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveDemo('camera')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeDemo === 'camera'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-3xl mb-2">📷</div>
                <div className="font-semibold text-gray-800">Camera AR (Lenskart-style)</div>
                <div className="text-sm text-gray-600 mt-1">
                  Live camera with 3D overlay - Works Now!
                </div>
                <div className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block">
                  ✓ Camera Access Enabled
                </div>
              </button>

              <button
                onClick={() => setActiveDemo('webxr')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeDemo === 'webxr'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-3xl mb-2">🥽</div>
                <div className="font-semibold text-gray-800">WebXR AR Placement</div>
                <div className="text-sm text-gray-600 mt-1">
                  Place 3D models in real world (mobile)
                </div>
                <div className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                  Requires ARKit/ARCore
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeDemo === 'camera' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span>📷</span> Camera AR Experience (Lenskart-style)
              </h2>
              <p className="text-gray-600 mb-4">
                Experience AR like Lenskart's try-on! Enable your camera to see farming equipment overlaid on your real environment.
              </p>
              <CameraARViewer />
            </div>
          )}

          {activeDemo === 'webxr' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span>🥽</span> WebXR AR Placement
              </h2>
              <p className="text-gray-600 mb-4">
                Place 3D farming equipment in your real environment using WebXR AR (works best on mobile devices with ARCore/ARKit)
              </p>
              <WebXRARViewer />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
